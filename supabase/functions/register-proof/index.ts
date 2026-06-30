// Proof integrity: after a client uploads a proof image to the wager-proofs
// bucket, it calls this with the storage path. We download the bytes with the
// service role, compute the SHA-256 *server-side* (so the hash can't be
// spoofed by the client), and record it. If the same hash already exists for a
// DIFFERENT wager, the new asset is flagged as a duplicate — a strong signal of
// a recycled / reused screenshot.
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

    const { wager_id, storage_path, context } = await req.json() as {
      wager_id: string
      storage_path: string
      context: 'declaration' | 'dispute'
    }

    const { data: wager } = await supabaseAdmin
      .from('wagers').select('created_by, opponent_id').eq('id', wager_id).single()
    if (!wager) throw new Error('Wager not found')
    if (user.id !== wager.created_by && user.id !== wager.opponent_id) {
      throw new Error('Not a party to this wager')
    }
    // The path must belong to this wager (paths are prefixed with the wager id).
    if (!storage_path.startsWith(`${wager_id}/`)) throw new Error('Path does not match wager')

    // Pull the bytes with the service role and hash them.
    const { data: blob, error: dlError } = await supabaseAdmin
      .storage.from('wager-proofs').download(storage_path)
    if (dlError || !blob) throw new Error('Could not read uploaded file')

    const buf = new Uint8Array(await blob.arrayBuffer())
    const digest = await crypto.subtle.digest('SHA-256', buf)
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

    // Look for the same content already registered on another wager.
    const { data: prior } = await supabaseAdmin
      .from('proof_assets')
      .select('id, wager_id')
      .eq('sha256', sha256)
      .neq('wager_id', wager_id)
      .limit(1)
      .maybeSingle()

    const duplicateOf = prior?.id ?? null

    const { data: asset, error: insErr } = await supabaseAdmin
      .from('proof_assets')
      .insert({
        wager_id,
        user_id: user.id,
        storage_path,
        sha256,
        context,
        duplicate_of: duplicateOf,
        byte_size: buf.byteLength,
      })
      .select('id')
      .single()
    if (insErr) throw insErr

    if (duplicateOf) {
      // Leave an audit trail so reviewers see the reuse flag in the timeline.
      await supabaseAdmin.from('wager_events').insert({
        wager_id,
        actor_id: user.id,
        event_type: 'proof_reuse_flagged',
        payload: { sha256, duplicate_of_wager: prior?.wager_id, proof_asset_id: asset.id },
      })
    }

    return new Response(
      JSON.stringify({ proof_asset_id: asset.id, sha256, duplicate: Boolean(duplicateOf) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
