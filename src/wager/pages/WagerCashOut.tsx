import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { cn } from '@/lib/utils'

/** Cash out — UI only; amounts are placeholders (no payout-rails wiring here). */
const BALANCE = 418.5
const FEE_PCT = 0.015

export default function WagerCashOut() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState(BALANCE)
  const fee = amount * FEE_PCT
  const net = amount - fee

  const fmt = (v: number) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="CASH OUT" onBack={() => navigate('/wager/wallet')} />

      <div className="mt-6 text-center">
        <div className="wg-label tracking-[0.14em]">AMOUNT</div>
        <div className="mt-1.5 font-display text-[56px] font-extrabold tracking-tight text-ink">{fmt(amount)}</div>
        <button onClick={() => setAmount(BALANCE)} className="mt-0.5 text-[11px] font-semibold" style={{ color: 'hsl(var(--win))' }}>
          Cash out full balance
        </button>
      </div>

      <div className="mt-[22px] flex gap-[7px]">
        {[50, 100, BALANCE].map((v, i) => {
          const selected = amount === v
          const label = i === 2 ? 'All' : `$${v}`
          return (
            <button
              key={i}
              onClick={() => setAmount(v)}
              className={cn('flex-1 rounded-[11px] border py-[11px] text-center text-[13px] font-bold', selected ? 'border-[1.5px] border-you bg-you-tint text-you' : 'border-border bg-surface text-muted-foreground')}
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
          <div className="text-[13px] font-bold text-ink">Visa •••• 4242</div>
          <div className="mt-px text-[11px] font-medium text-muted-foreground">Instant · arrives in seconds</div>
        </div>
        <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />
      </div>

      <div className="mt-3.5 flex justify-between px-0.5 text-[12px] font-medium text-muted-foreground">
        <span>Instant fee (1.5%)</span>
        <span className="text-ink">−{fmt(fee)}</span>
      </div>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA onClick={() => { toast.success(`${fmt(net)} on its way to your Visa.`); navigate('/wager/wallet') }}>
          Cash out {fmt(net)}
        </PrimaryCTA>
      </div>
    </div>
  )
}
