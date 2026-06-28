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

    // Verify the calling user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { wager_id, role } = await req.json() as { wager_id: string; role: 'creator' | 'opponent' }

    // Fetch wager
    const { data: wager, error: wagerError } = await supabaseAdmin
      .from('wagers')
      .select('*')
      .eq('id', wager_id)
      .single()

    if (wagerError || !wager) throw new Error('Wager not found')

    // Validate role and user
    if (role === 'creator' && wager.created_by !== user.id) throw new Error('Not the creator')
    if (role === 'opponent' && wager.opponent_id !== user.id) throw new Error('Not the opponent')
    if (role === 'creator' && wager.status !== 'pending_payment') throw new Error('Already paid')
    if (role === 'opponent' && wager.status !== 'opponent_joined') throw new Error('Not in correct state')

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: wager.wager_amount_cents,
      currency: 'usd',
      capture_method: 'automatic',
      metadata: { wager_id, role, user_id: user.id },
      description: `Wagerly: ${wager.sport} challenge — ${role}`,
    })

    // Store the intent ID on the wager
    const field = role === 'creator' ? 'creator_payment_intent_id' : 'opponent_payment_intent_id'
    await supabaseAdmin.from('wagers').update({ [field]: paymentIntent.id }).eq('id', wager_id)

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
