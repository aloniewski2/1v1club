// @ts-ignore — Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore — Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

const CASHOUT_FEE_PCT = 1.5

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

    const { amount_cents } = await req.json() as { amount_cents: number }
    if (!Number.isInteger(amount_cents) || amount_cents <= 0) throw new Error('Invalid amount')

    // Compute the user's available balance from the ledger (service role).
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from('ledger_entries')
      .select('amount_cents, type, status')
      .eq('user_id', user.id)
    if (ledgerError) throw new Error('Could not load balance')

    const SPENDABLE = ['winnings', 'cashout', 'cashout_fee', 'refund', 'deposit']
    const available = (ledger ?? [])
      .filter((e) => e.status === 'settled' && SPENDABLE.includes(e.type))
      .reduce((sum, e) => sum + e.amount_cents, 0)

    const fee = Math.round(amount_cents * (CASHOUT_FEE_PCT / 100))
    if (amount_cents + fee > available) throw new Error('Amount exceeds available balance')

    // Payout destination must be a ready Connect account.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, stripe_account_ready')
      .eq('id', user.id)
      .single()
    if (!profile?.stripe_account_id) throw new Error('No payout account set up')
    if (!profile.stripe_account_ready) throw new Error('Payout account not ready')

    const net = amount_cents - fee
    const transfer = await stripe.transfers.create({
      amount: net,
      currency: 'usd',
      destination: profile.stripe_account_id,
      metadata: { user_id: user.id, kind: 'cashout' },
      description: 'Wagerly cash out',
    })

    // Record the withdrawal + fee as debits.
    await supabaseAdmin.from('ledger_entries').insert([
      {
        user_id: user.id,
        type: 'cashout',
        amount_cents: -amount_cents,
        status: 'settled',
        stripe_ref: transfer.id,
        description: 'Cashed out to bank',
      },
      {
        user_id: user.id,
        type: 'cashout_fee',
        amount_cents: -fee,
        status: 'settled',
        stripe_ref: transfer.id,
        description: `Instant fee (${CASHOUT_FEE_PCT}%)`,
      },
    ])

    return new Response(
      JSON.stringify({ transfer_id: transfer.id, net_cents: net, fee_cents: fee }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
