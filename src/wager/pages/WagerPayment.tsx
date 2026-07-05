import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { useAuth } from '../hooks/useAuth'
import { useWager } from '../hooks/useWager'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatCents } from '../lib/wagerUtils'
import PotDisplay from '../components/PotDisplay'
import SportGlyph from '../components/SportGlyph'
import ScreenHeader from '../components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function PaymentForm({ wagerId }: { wagerId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/${wagerId}?paid=true` },
    })
    setLoading(false)
    if (error) toast.error(error.message ?? 'Payment failed. Please try again.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-4 font-display text-[15px] font-extrabold text-[hsl(var(--cta-ink))] transition-opacity hover:opacity-95 disabled:opacity-60"
        style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
      >
        <Lock className="h-4 w-4" strokeWidth={2} />
        {loading ? 'Processing…' : 'Pay & activate'}
      </button>
      <p className="text-center text-[11px] font-medium text-muted-foreground">
        Payments are processed securely by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  )
}

export default function WagerPayment() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { wager, loading: wagerLoading } = useWager(id)
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchingIntent, setFetchingIntent] = useState(true)
  const [intentError, setIntentError] = useState<string | null>(null)

  const role: 'creator' | 'opponent' = wager?.created_by === user?.id ? 'creator' : 'opponent'

  useEffect(() => {
    if (searchParams.get('payment_intent_client_secret') || searchParams.get('paid')) {
      navigate(`/${id}`, { replace: true })
    }
  }, [searchParams, id, navigate])

  useEffect(() => {
    if (!wager || !user) return
    async function fetchClientSecret() {
      setFetchingIntent(true)
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { wager_id: wager!.id, role },
      })
      if (error || !data?.clientSecret) setIntentError(error?.message ?? 'Failed to initialize payment')
      else setClientSecret(data.clientSecret)
      setFetchingIntent(false)
    }
    fetchClientSecret()
  }, [wager?.id, user?.id, role])

  if (wagerLoading || fetchingIntent) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-[18px]" />
        <Skeleton className="h-32 w-full rounded-[18px]" />
      </div>
    )
  }

  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>
  if (intentError) {
    return (
      <div className="space-y-3 py-12 text-center">
        <p style={{ color: 'hsl(var(--rival))' }}>{intentError}</p>
        <Button variant="outline" onClick={() => navigate(`/${id}`)}>Back to challenge</Button>
      </div>
    )
  }

  const sport = SPORT_CONFIG[wager.sport]
  const categoryLabel = wager.category || wager.custom_sport_label || sport.label
  const myStakeCents =
    role === 'creator'
      ? (wager.creator_stake_cents ?? wager.wager_amount_cents / 2)
      : (wager.opponent_stake_cents ?? wager.wager_amount_cents / 2)

  return (
    <div className="flex flex-col">
      <ScreenHeader label="PAY TO ACTIVATE" onBack={() => navigate(`/${id}`)} />

      <div className="mt-4 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-glyph text-ink">
            <SportGlyph sport={wager.sport} size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-ink">{categoryLabel}</p>
            <p className="truncate text-sm text-muted-foreground">{wager.description}</p>
          </div>
        </div>
        <div className="mt-3.5">
          <PotDisplay wagerAmountCents={wager.wager_amount_cents} showBreakdown />
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Your stake: <strong className="text-ink">{formatCents(myStakeCents)}</strong>
        </p>
      </div>

      {clientSecret && (
        <div className="mt-4">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#5a6dff', borderRadius: '12px' } } }}
          >
            <PaymentForm wagerId={wager.id} />
          </Elements>
        </div>
      )}
    </div>
  )
}
