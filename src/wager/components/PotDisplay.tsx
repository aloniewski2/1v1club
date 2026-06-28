import { formatPot, calcPayout, formatCents } from '../lib/wagerUtils'
import { PLATFORM_FEE_PCT } from '../lib/wagerConstants'

interface Props {
  wagerAmountCents: number
  showBreakdown?: boolean
}

export default function PotDisplay({ wagerAmountCents, showBreakdown }: Props) {
  if (showBreakdown) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-[18px] py-4">
        <div>
          <div className="wg-label tracking-[0.14em]">TOTAL POT</div>
          <div className="mt-0.5 font-display text-[30px] font-extrabold leading-none text-ink">
            {formatPot(wagerAmountCents)}
          </div>
        </div>
        <div className="text-right">
          <div className="wg-label tracking-[0.1em]">WINNER TAKES</div>
          <div className="mt-0.5 font-display text-[22px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>
            {formatCents(calcPayout(wagerAmountCents))}
          </div>
          <div className="mt-px text-[10px] font-medium text-muted-foreground">after {PLATFORM_FEE_PCT}% fee</div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="wg-label tracking-[0.14em]">TOTAL POT</div>
      <div className="mt-1 font-display text-5xl font-extrabold tracking-tight text-ink">
        {formatPot(wagerAmountCents)}
      </div>
    </div>
  )
}
