// A party to a disputed wager submits their case: a written statement, who they
// claim won, and evidence image paths (already uploaded + registered via
// register-proof). Submissions are LOCKED — one per party, never editable — so
// neither side can revise their story after seeing the other's.
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

    const { wager_id, statement, claimed_winner_id, evidence_paths } = await req.json() as {
      wager_id: string
      statement: string
      claimed_winner_id: string
      evidence_paths?: string[]
    }

    if (!statement || statement.trim().length < 5) throw new Error('Add a short statement explaining your case')

    const { data: wager } = await supabaseAdmin.from('wagers').select('*').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')
    if (wager.status !== 'disputed') throw new Error('This wager is not in dispute')
    if (user.id !== wager.created_by && user.id !== wager.opponent_id) {
      throw new Error('Not a party to this wager')
    }
    if (![wager.created_by, wager.opponent_id].includes(claimed_winner_id)) {
      throw new Error('Claimed winner must be a participant')
    }

    // Ensure a single dispute case exists for the wager.
    let { data: dispute } = await supabaseAdmin
      .from('wager_disputes').select('*').eq('wager_id', wager_id).maybeSingle()
    if (!dispute) {
      const { data: created, error: dErr } = await supabaseAdmin
        .from('wager_disputes')
        .insert({ wager_id, opened_by: user.id, status: 'open' })
        .select()
        .single()
      if (dErr) throw dErr
      dispute = created
    }
    if (dispute.status !== 'open') throw new Error('This dispute is already resolved')

    // Lock: reject a second submission from the same party.
    const { data: existing } = await supabaseAdmin
      .from('dispute_submissions')
      .select('id')
      .eq('dispute_id', dispute.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) throw new Error('You already submitted your evidence — it cannot be changed')

    // Only accept evidence paths that were registered (hashed) for this wager
    // by this user, so statements can't reference arbitrary or unverified files.
    let verifiedPaths: string[] = []
    if (evidence_paths?.length) {
      const { data: assets } = await supabaseAdmin
        .from('proof_assets')
        .select('storage_path')
        .eq('wager_id', wager_id)
        .eq('user_id', user.id)
        .in('storage_path', evidence_paths)
      verifiedPaths = (assets ?? []).map((a: { storage_path: string }) => a.storage_path)
    }

    const { error: subErr } = await supabaseAdmin.from('dispute_submissions').insert({
      dispute_id: dispute.id,
      wager_id,
      user_id: user.id,
      statement: statement.trim().slice(0, 2000),
      claimed_winner_id,
      evidence_paths: verifiedPaths,
    })
    if (subErr) throw subErr

    await supabaseAdmin.from('wager_events').insert({
      wager_id,
      actor_id: user.id,
      event_type: 'dispute_evidence_submitted',
      payload: { claimed_winner_id, evidence_count: verifiedPaths.length },
    })

    // If both parties have now submitted, the case is ready for review.
    const { count } = await supabaseAdmin
      .from('dispute_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('dispute_id', dispute.id)
    const bothSubmitted = (count ?? 0) >= 2

    const otherId = user.id === wager.created_by ? wager.opponent_id : wager.created_by
    if (otherId && !bothSubmitted) {
      await supabaseAdmin.from('notifications').insert({
        user_id: otherId, wager_id, type: 'dispute_evidence',
        title: 'Opponent submitted dispute evidence',
        body: 'Submit your own statement and proof before the evidence deadline.',
      })
    }

    return new Response(
      JSON.stringify({ ok: true, both_submitted: bothSubmitted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
