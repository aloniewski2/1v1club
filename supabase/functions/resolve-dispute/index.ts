// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Admin-only: must use service role key
    const authHeader = req.headers.get('Authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
      throw new Error('Admin access required')
    }

    const { wager_id, winner_id, resolution_note } = await req.json() as {
      wager_id: string
      winner_id: string
      resolution_note?: string
    }

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')
    if (wager.status !== 'disputed') throw new Error('Wager is not in disputed state')
    if (![wager.created_by, wager.opponent_id].includes(winner_id)) throw new Error('Invalid winner')

    const now = new Date().toISOString()
    await supabaseAdmin.from('wagers').update({
      confirmed_winner_id: winner_id,
      status: 'completed',
      updated_at: now,
    }).eq('id', wager_id)

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: null,
      event_type: 'dispute_resolved',
      payload: { winner_id, resolution_note: resolution_note ?? '' },
    })

    // Trigger payout
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-payout`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({ wager_id, winner_id }),
    })

    const losingId = winner_id === wager.created_by ? wager.opponent_id : wager.created_by
    await supabaseAdmin.from('notifications').insert([
      {
        user_id: winner_id, wager_id, type: 'dispute_resolved',
        title: 'Dispute resolved — you won! 🏆',
        body: resolution_note ? `Resolution: ${resolution_note}` : 'Payout is on its way.',
      },
      {
        user_id: losingId, wager_id, type: 'dispute_resolved',
        title: 'Dispute resolved',
        body: resolution_note ? `Resolution: ${resolution_note}` : 'The dispute has been resolved.',
      },
    ])

    return new Response(
      JSON.stringify({ status: 'completed', winner_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
