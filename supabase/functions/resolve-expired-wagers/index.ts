// Scheduled job: enforce the declaration deadline so a match can't sit
// unresolved forever.
//
//   • One side declared, the other ghosted past the deadline  -> FORFEIT:
//     the declared winner is auto-confirmed and awarded points.
//   • Neither side declared past the deadline                 -> VOID:
//     the match is cancelled with no points awarded.
//   • Disputed matches are left alone (handled by admin review).
//
// Free-to-play: no money is moved. Guarded by CRON_SECRET.
// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const cronSecret = Deno.env.get('CRON_SECRET')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ok =
      authHeader === `Bearer ${serviceKey}` ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`)
    if (!ok) throw new Error('Unauthorized')

    const nowIso = new Date().toISOString()

    const { data: expired, error } = await supabaseAdmin
      .from('wagers')
      .select('*')
      .in('status', ['active', 'declaring'])
      .lt('declaration_deadline', nowIso)
      .is('confirmed_winner_id', null)
    if (error) throw error

    const results: Array<{ wager_id: string; outcome: string }> = []

    for (const wager of expired ?? []) {
      const declared =
        wager.declared_winner_by_creator ?? wager.declared_winner_by_opponent ?? null

      if (declared) {
        // FORFEIT — one party declared; the other never responded.
        await supabaseAdmin
          .from('wagers')
          .update({ confirmed_winner_id: declared, status: 'completed', updated_at: nowIso })
          .eq('id', wager.id)
          .is('confirmed_winner_id', null)

        const loser = declared === wager.created_by ? wager.opponent_id : wager.created_by
        const ranked = (wager.mode ?? 'ranked') === 'ranked'
        if (loser) {
          await supabaseAdmin.rpc('record_match_result', {
            p_winner: declared, p_loser: loser, p_ranked: ranked,
          })
        }

        await supabaseAdmin.from('wager_events').insert({
          wager_id: wager.id, actor_id: null, event_type: 'forfeit_resolved',
          payload: { winner_id: declared, reason: 'opponent_did_not_declare_by_deadline' },
        })

        await supabaseAdmin.from('notifications').insert([
          {
            user_id: declared, wager_id: wager.id, type: 'forfeit_win',
            title: 'You won by forfeit 🏆',
            body: ranked ? 'Your opponent never confirmed in time. +25 points.' : 'Your opponent never confirmed in time.',
          },
          ...(loser ? [{
            user_id: loser, wager_id: wager.id, type: 'forfeit_loss',
            title: 'Challenge auto-resolved',
            body: 'You did not declare a result before the deadline, so the win went to your opponent.',
          }] : []),
        ])

        results.push({ wager_id: wager.id, outcome: 'forfeit' })
      } else {
        // VOID — neither party declared. No points, no result.
        await supabaseAdmin
          .from('wagers')
          .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
          .eq('id', wager.id)

        await supabaseAdmin.from('wager_events').insert({
          wager_id: wager.id, actor_id: null, event_type: 'voided',
          payload: { reason: 'neither_party_declared_by_deadline' },
        })

        for (const uid of [wager.created_by, wager.opponent_id].filter(Boolean)) {
          await supabaseAdmin.from('notifications').insert({
            user_id: uid, wager_id: wager.id, type: 'voided',
            title: 'Challenge expired',
            body: 'Neither player declared a result in time, so the match was voided.',
          })
        }

        results.push({ wager_id: wager.id, outcome: 'voided' })
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
