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
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { wager_id, declared_winner_id, score, proof_path } = await req.json() as {
      wager_id: string
      declared_winner_id: string
      score?: string | null
      proof_path?: string | null
    }

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')

    if (!['active', 'declaring'].includes(wager.status)) throw new Error('Wager not in declarable state')
    if (user.id !== wager.created_by && user.id !== wager.opponent_id) throw new Error('Not a party to this wager')
    if (![wager.created_by, wager.opponent_id].includes(declared_winner_id)) throw new Error('Invalid winner: must be a participant')

    const isCreator = user.id === wager.created_by
    const declarationField = isCreator ? 'declared_winner_by_creator' : 'declared_winner_by_opponent'
    const scoreField = isCreator ? 'creator_score' : 'opponent_score'
    const proofField = isCreator ? 'creator_proof_path' : 'opponent_proof_path'
    const otherDeclaration = isCreator ? wager.declared_winner_by_opponent : wager.declared_winner_by_creator
    const otherUserId = isCreator ? wager.opponent_id : wager.created_by

    const proofAndScoreUpdate: Record<string, string | null> = {}
    if (score !== undefined) proofAndScoreUpdate[scoreField] = score ?? null
    if (proof_path !== undefined) proofAndScoreUpdate[proofField] = proof_path ?? null

    const now = new Date().toISOString()
    let newStatus: string

    if (otherDeclaration === null) {
      // First to declare
      newStatus = 'declaring'
      await supabaseAdmin.from('wagers').update({
        [declarationField]: declared_winner_id,
        ...proofAndScoreUpdate,
        status: newStatus,
        updated_at: now,
      }).eq('id', wager_id)

      await supabaseAdmin.from('wager_events').insert({
        wager_id, actor_id: user.id, event_type: 'winner_declared',
        payload: { declared_winner: declared_winner_id },
      })

      await supabaseAdmin.from('notifications').insert({
        user_id: otherUserId,
        wager_id,
        type: 'declare_winner',
        title: 'Time to declare the winner!',
        body: 'Your opponent declared the winner. Confirm or dispute now.',
      })
    } else if (otherDeclaration === declared_winner_id) {
      // Both agree
      newStatus = 'completed'
      await supabaseAdmin.from('wagers').update({
        [declarationField]: declared_winner_id,
        ...proofAndScoreUpdate,
        confirmed_winner_id: declared_winner_id,
        status: newStatus,
        updated_at: now,
      }).eq('id', wager_id)

      await supabaseAdmin.from('wager_events').insert([
        { wager_id, actor_id: user.id, event_type: 'winner_declared', payload: { declared_winner: declared_winner_id } },
        { wager_id, actor_id: null, event_type: 'winner_confirmed', payload: { winner_id: declared_winner_id } },
      ])

      // Free-to-play: award ranking points instead of a cash payout.
      await awardPoints(wager, declared_winner_id)
    } else {
      // Disagree
      newStatus = 'disputed'
      await supabaseAdmin.from('wagers').update({
        [declarationField]: declared_winner_id,
        ...proofAndScoreUpdate,
        status: newStatus,
        updated_at: now,
      }).eq('id', wager_id)

      await supabaseAdmin.from('wager_events').insert([
        { wager_id, actor_id: user.id, event_type: 'winner_declared', payload: { declared_winner: declared_winner_id } },
        { wager_id, actor_id: null, event_type: 'disputed', payload: {} },
      ])

      // Notify both parties
      await supabaseAdmin.from('notifications').insert([
        {
          user_id: wager.created_by,
          wager_id,
          type: 'disputed',
          title: 'Challenge disputed',
          body: 'You and your opponent disagree on the winner. Our team will review.',
        },
        {
          user_id: wager.opponent_id,
          wager_id,
          type: 'disputed',
          title: 'Challenge disputed',
          body: 'You and your opponent disagree on the winner. Our team will review.',
        },
      ])
    }

    return new Response(
      JSON.stringify({ status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// deno-lint-ignore no-explicit-any
async function awardPoints(wager: any, winnerId: string) {
  const loserId = winnerId === wager.created_by ? wager.opponent_id : wager.created_by
  const ranked = (wager.mode ?? 'ranked') === 'ranked'

  const stake = ranked ? (wager.stake_points ?? 25) : 0
  if (loserId) {
    await supabaseAdmin.rpc('settle_match', {
      p_winner: winnerId,
      p_loser: loserId,
      p_stake: stake,
      p_wager: wager.id,
      p_label: wager.category ?? wager.sport ?? 'match',
    })
  }

  const pts = ranked ? `+${stake} pts` : 'a casual win'
  await supabaseAdmin.from('notifications').insert([
    {
      user_id: winnerId,
      wager_id: wager.id,
      type: 'match_won',
      title: 'You won! 🏆',
      body: ranked ? `You won +${stake} points.` : 'Casual win recorded.',
    },
    ...(loserId ? [{
      user_id: loserId,
      wager_id: wager.id,
      type: 'match_complete',
      title: 'Challenge complete',
      body: `Your opponent took the win (${pts}).`,
    }] : []),
  ])
}
