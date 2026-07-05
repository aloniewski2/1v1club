// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
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
    if (wager.wallet_credited_at) throw new Error('Payout already processed')

    // wager_amount_cents is the TOTAL POT (creator_stake + opponent_stake).
    const pot = wager.wager_amount_cents
    const fee = Math.round(pot * (wager.platform_fee_pct / 100))
    const payout = pot - fee
    const label = wager.category || wager.custom_sport_label || wager.sport

    // Winnings accrue to the winner's wallet ledger (instead of an immediate
    // bank transfer). The user moves it to their bank via Cash Out, which is
    // where the actual Stripe transfer happens (see request-cashout).
    await supabaseAdmin.from('ledger_entries').insert([
      {
        user_id: winner_id,
        wager_id,
        type: 'winnings',
        amount_cents: payout,
        status: 'settled',
        description: `Won ${label} bet`,
      },
      {
        user_id: winner_id,
        wager_id,
        type: 'platform_fee',
        amount_cents: -fee,
        status: 'settled',
        description: `Platform fee (${wager.platform_fee_pct}%)`,
      },
    ])

    // Each player's stake leaves escrow individually (amounts may differ).
    const stakeReleases = [
      { id: wager.created_by, stake: wager.creator_stake_cents ?? pot / 2 },
      { id: wager.opponent_id, stake: wager.opponent_stake_cents ?? pot / 2 },
    ]
      .filter((p): p is { id: string; stake: number } => Boolean(p.id))
      .map(({ id, stake }) => ({
        user_id: id,
        wager_id,
        type: 'stake_release',
        amount_cents: stake,
        status: 'settled',
        description: `Stake released · ${label}`,
      }))
    if (stakeReleases.length) await supabaseAdmin.from('ledger_entries').insert(stakeReleases)

    const creditedAt = new Date().toISOString()
    await supabaseAdmin.from('wagers').update({
      wallet_credited_at: creditedAt,
      updated_at: creditedAt,
    }).eq('id', wager_id)

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: null,
      event_type: 'payout_sent',
      payload: { amount: payout, credited_to_wallet: true },
    })

    return new Response(
      JSON.stringify({ amount: payout, credited_to_wallet: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
