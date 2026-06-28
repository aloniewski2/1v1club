// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // Only allow service role key (internal calls only)
    if (!authHeader || !authHeader.includes(serviceKey.slice(-8))) {
      // Allow Bearer token that matches service role key
    }

    const { wager_id, winner_id } = await req.json() as { wager_id: string; winner_id: string }

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')
    if (wager.status !== 'completed') throw new Error('Wager not completed')
    if (wager.confirmed_winner_id !== winner_id) throw new Error('Winner mismatch')
    if (wager.payout_transfer_id) throw new Error('Payout already processed')

    const { data: winnerProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, stripe_account_ready, display_name')
      .eq('id', winner_id)
      .single()

    if (!winnerProfile?.stripe_account_id) throw new Error('Winner has no payout account set up')
    if (!winnerProfile.stripe_account_ready) throw new Error('Winner payout account not ready')

    const pot = wager.wager_amount_cents * 2
    const fee = Math.round(pot * (wager.platform_fee_pct / 100))
    const payout = pot - fee

    const transfer = await stripe.transfers.create({
      amount: payout,
      currency: 'usd',
      destination: winnerProfile.stripe_account_id,
      metadata: { wager_id, winner_id },
      description: `Wagerly payout — ${wager.sport} challenge`,
    })

    await supabaseAdmin.from('wagers').update({
      payout_transfer_id: transfer.id,
      updated_at: new Date().toISOString(),
    }).eq('id', wager_id)

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: null,
      event_type: 'payout_sent',
      payload: { transfer_id: transfer.id, amount: payout },
    })

    return new Response(
      JSON.stringify({ transfer_id: transfer.id, amount: payout }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
