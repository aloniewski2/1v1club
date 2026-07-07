// Resolution for FFA / team matches: host starts the match and declares a
// winner; every other participant confirms; once all confirm, the pot settles
// zero-sum via settle_multiplayer. Any participant can dispute instead.
//
// Actions: 'start' | 'declare' | 'confirm' | 'dispute'
// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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

    const { wager_id, action, winner_user, winner_team } = await req.json() as {
      wager_id: string
      action: 'start' | 'declare' | 'confirm' | 'dispute'
      winner_user?: string | null
      winner_team?: number | null
    }

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Match not found')
    if (wager.format === '1v1') throw new Error('Use the 1v1 flow for this match')

    const { data: parts } = await supabaseAdmin
      .from('wager_participants').select('*').eq('wager_id', wager_id)
    const participants = parts ?? []
    const isHost = wager.created_by === user.id
    const meParticipant = participants.find((p: { user_id: string }) => p.user_id === user.id)
    if (!meParticipant && !isHost) throw new Error('Not a participant')

    const now = new Date().toISOString()
    const label = wager.category ?? wager.sport

    // ---- START ----
    if (action === 'start') {
      if (!isHost) throw new Error('Only the host can start the match')
      if (wager.status !== 'awaiting_opponent') throw new Error('Match already started')
      if (participants.length < 2) throw new Error('Need at least 2 players to start')
      await supabaseAdmin.from('wagers').update({ status: 'active', updated_at: now }).eq('id', wager_id)
      await notify(participants, user.id, wager_id, 'match_active', "Match is live!", `${label} has started — good luck.`)
      return json({ status: 'active' })
    }

    // ---- DECLARE (host) ----
    if (action === 'declare') {
      if (!isHost) throw new Error('Only the host can declare the winner')
      if (!['active', 'declaring'].includes(wager.status)) throw new Error('Match is not in play')
      if (wager.format === 'teams') {
        if (winner_team == null) throw new Error('Pick the winning team')
      } else if (!winner_user || !participants.some((p: { user_id: string }) => p.user_id === winner_user)) {
        throw new Error('Pick a winner from the roster')
      }
      // Reset confirmations; the host is auto-confirmed of their own call.
      await supabaseAdmin.from('wager_participants').update({ result_confirmed: false }).eq('wager_id', wager_id)
      await supabaseAdmin.from('wager_participants').update({ result_confirmed: true }).eq('wager_id', wager_id).eq('user_id', user.id)
      await supabaseAdmin.from('wagers').update({
        declared_winner_user: wager.format === 'teams' ? null : winner_user,
        declared_winner_team: wager.format === 'teams' ? winner_team : null,
        status: 'declaring', updated_at: now,
      }).eq('id', wager_id)
      await supabaseAdmin.from('wager_events').insert({
        wager_id, actor_id: user.id, event_type: 'winner_declared',
        payload: { winner_user, winner_team },
      })
      await notify(participants.filter((p: { user_id: string }) => p.user_id !== user.id), null, wager_id,
        'declare_winner', 'Confirm the result', 'The host declared a winner. Confirm or dispute.')
      return json({ status: 'declaring' })
    }

    // ---- CONFIRM (participant) ----
    if (action === 'confirm') {
      if (wager.status !== 'declaring') throw new Error('Nothing to confirm yet')
      await supabaseAdmin.from('wager_participants')
        .update({ result_confirmed: true }).eq('wager_id', wager_id).eq('user_id', user.id)

      const { data: fresh } = await supabaseAdmin
        .from('wager_participants').select('result_confirmed').eq('wager_id', wager_id)
      const allConfirmed = (fresh ?? []).every((p: { result_confirmed: boolean }) => p.result_confirmed)

      if (allConfirmed) {
        await supabaseAdmin.rpc('settle_multiplayer', {
          p_wager: wager_id,
          p_winner_user: wager.format === 'teams' ? null : wager.declared_winner_user,
          p_winner_team: wager.format === 'teams' ? wager.declared_winner_team : null,
        })
        await supabaseAdmin.from('wager_events').insert({
          wager_id, actor_id: null, event_type: 'winner_confirmed', payload: {},
        })
        // Notify winners/losers.
        const winners = wager.format === 'teams'
          ? participants.filter((p: { team_no: number }) => p.team_no === wager.declared_winner_team)
          : participants.filter((p: { user_id: string }) => p.user_id === wager.declared_winner_user)
        const winnerIds = new Set(winners.map((p: { user_id: string }) => p.user_id))
        for (const p of participants) {
          const won = winnerIds.has(p.user_id)
          await supabaseAdmin.from('notifications').insert({
            user_id: p.user_id, wager_id, type: won ? 'match_won' : 'match_complete',
            title: won ? 'You won! 🏆' : 'Match complete',
            body: won ? `You took the ${label} pot.` : `${label} is settled.`,
          })
        }
        return json({ status: 'completed' })
      }
      return json({ status: 'declaring', confirmed: true })
    }

    // ---- DISPUTE (participant) ----
    if (action === 'dispute') {
      if (!['declaring', 'active'].includes(wager.status)) throw new Error('Cannot dispute now')
      await supabaseAdmin.from('wagers').update({ status: 'disputed', updated_at: now }).eq('id', wager_id)
      await supabaseAdmin.from('wager_events').insert({
        wager_id, actor_id: user.id, event_type: 'disputed', payload: {},
      })
      await notify(participants, null, wager_id, 'disputed', 'Result disputed',
        'A player disputed the result. A mod will review.')
      return json({ status: 'disputed' })
    }

    throw new Error('Unknown action')
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// deno-lint-ignore no-explicit-any
async function notify(recipients: any[], except: string | null, wagerId: string, type: string, title: string, body: string) {
  const rows = recipients
    .filter((p) => p.user_id !== except)
    .map((p) => ({ user_id: p.user_id, wager_id: wagerId, type, title, body }))
  if (rows.length) await supabaseAdmin.from('notifications').insert(rows)
}
