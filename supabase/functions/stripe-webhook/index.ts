// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const { wager_id, role, user_id } = pi.metadata

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) return new Response('Wager not found', { status: 404 })

    const now = new Date().toISOString()

    if (role === 'creator') {
      await supabaseAdmin.from('wagers').update({
        creator_charge_id: pi.latest_charge as string,
        creator_paid_at: now,
        status: 'awaiting_opponent',
        updated_at: now,
      }).eq('id', wager_id)

      await supabaseAdmin.from('wager_events').insert({
        wager_id,
        actor_id: user_id,
        event_type: 'creator_paid',
        payload: { payment_intent_id: pi.id },
      })

      // Record the stake as escrowed (display-only; released on settle/refund).
      const creatorStake = wager.creator_stake_cents ?? Math.round(wager.wager_amount_cents / 2)
      await supabaseAdmin.from('ledger_entries').insert({
        user_id, wager_id, type: 'stake_hold', amount_cents: -creatorStake,
        status: 'settled', description: `Stake escrowed · ${wager.category ?? wager.sport}`,
      })
    } else if (role === 'opponent') {
      const declarationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabaseAdmin.from('wagers').update({
        opponent_charge_id: pi.latest_charge as string,
        opponent_paid_at: now,
        status: 'active',
        declaration_deadline: declarationDeadline,
        updated_at: now,
      }).eq('id', wager_id)

      await supabaseAdmin.from('wager_events').insert({
        wager_id,
        actor_id: user_id,
        event_type: 'opponent_paid',
        payload: { payment_intent_id: pi.id },
      })

      // Record the opponent's stake as escrowed.
      const opponentStake = wager.opponent_stake_cents ?? Math.round(wager.wager_amount_cents / 2)
      await supabaseAdmin.from('ledger_entries').insert({
        user_id, wager_id, type: 'stake_hold', amount_cents: -opponentStake,
        status: 'settled', description: `Stake escrowed · ${wager.category ?? wager.sport}`,
      })

      // Notify creator that match is active
      await supabaseAdmin.from('notifications').insert({
        user_id: wager.created_by,
        wager_id,
        type: 'match_active',
        title: 'Challenge is live!',
        body: 'Your opponent paid. Go play and then declare the winner.',
      })
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const { wager_id, role } = pi.metadata
    if (wager_id && role) {
      const field = role === 'creator' ? 'creator_payment_intent_id' : 'opponent_payment_intent_id'
      const resetStatus = role === 'opponent' ? 'awaiting_opponent' : 'pending_payment'
      await supabaseAdmin.from('wagers').update({
        [field]: null,
        status: resetStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', wager_id)
    }
  }

  if (event.type === 'transfer.created') {
    const transfer = event.data.object as Stripe.Transfer
    const wager_id = transfer.metadata?.wager_id
    if (wager_id) {
      await supabaseAdmin.from('wagers').update({
        payout_transfer_id: transfer.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', wager_id)
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data.object as Stripe.Subscription
    const active = ['active', 'trialing', 'past_due'].includes(sub.status)
    await supabaseAdmin.from('profiles').update({
      is_pro: active,
      subscription_status: sub.status,
      pro_until: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('stripe_customer_id', sub.customer as string)
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    if (account.charges_enabled) {
      await supabaseAdmin.from('profiles').update({
        stripe_account_ready: true,
        updated_at: new Date().toISOString(),
      }).eq('stripe_account_id', account.id)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
