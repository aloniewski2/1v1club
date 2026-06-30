// Syncs the caller's Pro status from Stripe -> profile. Called on return from
// Checkout so activation is reflected immediately, without depending on webhook
// timing/config. Webhooks remain the source of truth for renewals/cancellations.
// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

const ACTIVE = ['active', 'trialing', 'past_due']

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

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('stripe_customer_id').eq('id', user.id).single()
    if (!profile?.stripe_customer_id) {
      return json({ is_pro: false, status: null })
    }

    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id, status: 'all', limit: 3,
    })
    // Pick the most relevant subscription (active first, else most recent).
    const sub = subs.data.sort((a, b) => b.created - a.created)
      .find((s) => ACTIVE.includes(s.status)) ?? subs.data[0] ?? null

    const isPro = sub ? ACTIVE.includes(sub.status) : false
    await supabaseAdmin.from('profiles').update({
      is_pro: isPro,
      subscription_status: sub?.status ?? null,
      pro_until: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    return json({ is_pro: isPro, status: sub?.status ?? null })
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
