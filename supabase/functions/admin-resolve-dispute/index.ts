// Admin-facing dispute resolution. Unlike resolve-dispute (service-role only,
// for internal/automation use), this authenticates the *caller's* JWT and
// verifies they are an admin (profiles.is_admin), so it can back a UI console.
// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
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
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Gate on the admin flag.
    const { data: me } = await supabaseAdmin
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!me?.is_admin) throw new Error('Admin access required')

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

    await supabaseAdmin.from('wager_disputes').update({
      status: 'resolved',
      resolution_winner_id: winner_id,
      resolution_note: resolution_note ?? null,
      resolved_by: user.id,
      resolved_at: now,
    }).eq('wager_id', wager_id)

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: user.id,
      event_type: 'dispute_resolved',
      payload: { winner_id, resolution_note: resolution_note ?? '', resolved_by: user.id },
    })

    // Free-to-play: award ranking points to the decided winner.
    const losingId = winner_id === wager.created_by ? wager.opponent_id : wager.created_by
    if (losingId) {
      await supabaseAdmin.rpc('record_match_result', {
        p_winner: winner_id, p_loser: losingId, p_ranked: (wager.mode ?? 'ranked') === 'ranked',
      })
    }
    await supabaseAdmin.from('notifications').insert([
      {
        user_id: winner_id, wager_id, type: 'dispute_resolved',
        title: 'Dispute resolved — you won! 🏆',
        body: resolution_note ? `Resolution: ${resolution_note}` : 'Payout is on its way.',
      },
      ...(losingId ? [{
        user_id: losingId, wager_id, type: 'dispute_resolved',
        title: 'Dispute resolved',
        body: resolution_note ? `Resolution: ${resolution_note}` : 'The dispute has been resolved.',
      }] : []),
    ])

    return new Response(
      JSON.stringify({ status: 'completed', winner_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
