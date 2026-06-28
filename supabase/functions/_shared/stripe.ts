// @ts-ignore — Deno import
import Stripe from 'https://esm.sh/stripe@14?target=deno'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  // @ts-ignore — Deno-specific fetch client
  httpClient: Stripe.createFetchHttpClient(),
})
