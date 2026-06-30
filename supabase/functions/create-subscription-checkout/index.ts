// Starts a Stripe Checkout session for a Wagerly Pro subscription.
// Hosted Checkout — no card UI to build. Returns the URL to redirect to.
// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
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

    const priceId = Deno.env.get('STRIPE_PRO_PRICE_ID')
    if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID not configured')

    const { origin } = await req.json().catch(() => ({ origin: '' })) as { origin?: string }
    const base = origin || req.headers.get('origin') || ''

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('stripe_customer_id, email, is_pro').eq('id', user.id).single()

    if (profile?.is_pro) throw new Error('You already have Wagerly Pro')

    // Reuse or create the Stripe customer.
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/pro?status=success`,
      cancel_url: `${base}/pro?status=cancelled`,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
