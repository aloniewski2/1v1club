import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useWallet } from '../hooks/useWallet'
import { formatCents } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const FEE_PCT = 0.015

export default function WagerCashOut() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { balance, loading } = useWallet(user?.id)
  const available = balance.available_cents

  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Default to the full balance once it loads.
  const amount = amountCents ?? available
  const fee = Math.round(amount * FEE_PCT)
  const net = amount - fee

  const presets = [5000, 10000, available]

  async function handleCashOut() {
    if (amount <= 0) return toast.error('Nothing to cash out yet.')
    if (!profile?.stripe_account_ready) {
      toast.error('Set up your payout account first (on the dashboard) before cashing out.')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.functions.invoke('request-cashout', {
      body: { amount_cents: amount },
    })
    setSubmitting(false)
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Cash out failed.')
    } else {
      toast.success(`${formatCents(data.net_cents)} on its way to your bank.`)
      navigate('/wallet')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="CASH OUT" onBack={() => navigate('/wallet')} />

      <div className="mt-6 text-center">
        <div className="wg-label tracking-[0.14em]">AMOUNT</div>
        {loading ? (
          <Skeleton className="mx-auto mt-2 h-14 w-48" />
        ) : (
          <div className="mt-1.5 font-display text-[56px] font-extrabold tracking-tight text-ink">{formatCents(amount)}</div>
        )}
        <button onClick={() => setAmountCents(available)} className="mt-0.5 text-[11px] font-semibold" style={{ color: 'hsl(var(--win))' }}>
          Cash out full balance · {formatCents(available)}
        </button>
      </div>

      <div className="mt-[22px] flex gap-[7px]">
        {presets.map((v, i) => {
          const selected = amount === v
          const label = i === 2 ? 'All' : formatCents(v)
          const disabled = v <= 0 || v > available
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => setAmountCents(v)}
              className={cn(
                'flex-1 rounded-[11px] border py-[11px] text-center text-[13px] font-bold disabled:opacity-40',
                selected ? 'border-[1.5px] border-you bg-you-tint text-you' : 'border-border bg-surface text-muted-foreground'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="wg-label mt-[22px]">TO</div>
      <div className="mt-2.5 flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-glyph text-ink">
          <CreditCard className="h-[19px] w-[19px]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink">{profile?.stripe_account_ready ? 'Your bank account' : 'No payout account yet'}</div>
          <div className="mt-px text-[11px] font-medium text-muted-foreground">
            {profile?.stripe_account_ready ? 'Instant · arrives in seconds' : 'Set up payouts from the dashboard'}
          </div>
        </div>
        <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />
      </div>

      <div className="mt-3.5 flex justify-between px-0.5 text-[12px] font-medium text-muted-foreground">
        <span>Instant fee (1.5%)</span>
        <span className="text-ink">−{formatCents(fee)}</span>
      </div>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA disabled={submitting || amount <= 0} onClick={handleCashOut}>
          {submitting ? 'Cashing out…' : `Cash out ${formatCents(net)}`}
        </PrimaryCTA>
      </div>
    </div>
  )
}
