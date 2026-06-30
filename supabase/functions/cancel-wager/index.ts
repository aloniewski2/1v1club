// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { wager_id } = await req.json() as { wager_id: string }

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')
    if (user.id !== wager.created_by) throw new Error('Only the creator can cancel')
    if (['completed', 'disputed', 'cancelled', 'refunded'].includes(wager.status)) {
      throw new Error('Cannot cancel a wager in this state')
    }
    if (wager.status === 'active') throw new Error('Cannot cancel an active wager — both players have paid')

    const now = new Date().toISOString()
    let finalStatus = 'cancelled'

    const label = wager.category ?? wager.sport
    const creatorStake = wager.creator_stake_cents ?? Math.round(wager.wager_amount_cents / 2)
    const opponentStake = wager.opponent_stake_cents ?? Math.round(wager.wager_amount_cents / 2)

    // Refund if opponent also paid (opponent_joined state)
    if (wager.status === 'opponent_joined' && wager.opponent_payment_intent_id) {
      await stripe.refunds.create({ payment_intent: wager.opponent_payment_intent_id })
      if (wager.opponent_id) {
        await supabaseAdmin.from('ledger_entries').insert({
          user_id: wager.opponent_id, wager_id, type: 'stake_release',
          amount_cents: opponentStake, status: 'settled',
          description: `Stake refunded · ${label}`,
        })
      }
    }
    if (wager.creator_payment_intent_id && wager.creator_paid_at) {
      await stripe.refunds.create({ payment_intent: wager.creator_payment_intent_id })
      finalStatus = 'refunded'
      await supabaseAdmin.from('ledger_entries').insert({
        user_id: wager.created_by, wager_id, type: 'stake_release',
        amount_cents: creatorStake, status: 'settled',
        description: `Stake refunded · ${label}`,
      })
    }

    await supabaseAdmin.from('wagers').update({
      status: finalStatus,
      cancelled_at: now,
      updated_at: now,
    }).eq('id', wager_id)

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: user.id,
      event_type: finalStatus,
      payload: {},
    })

    if (wager.opponent_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: wager.opponent_id,
        wager_id,
        type: 'cancelled',
        title: 'Challenge cancelled',
        body: 'The creator cancelled this challenge. Any payments have been refunded.',
      })
    }

    return new Response(
      JSON.stringify({ status: finalStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
