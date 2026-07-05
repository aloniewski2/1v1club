import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useWallet, type LedgerEntry } from '../hooks/useWallet'
import { formatCents } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'

// Ledger types that don't represent a real money movement in the activity feed.
const HIDDEN_TYPES = new Set(['platform_fee'])

export default function WagerWallet() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { entries, balance, loading } = useWallet(user?.id)

  const activity = entries.filter((e) => !HIDDEN_TYPES.has(e.type))
  const monthCredits = entries
    .filter((e) => e.amount_cents > 0 && e.type !== 'stake_release' && isThisMonth(e.created_at))
    .reduce((s, e) => s + e.amount_cents, 0)

  return (
    <div className="flex flex-col">
      <ScreenHeader label="WALLET" onBack={() => navigate('/profile')} />

      <div className="mt-4 rounded-[20px] px-[22px] py-[22px] text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}>
        <div className="font-mono text-[10px] font-bold tracking-[0.14em] opacity-75">AVAILABLE BALANCE</div>
        {loading ? (
          <Skeleton className="mt-2 h-[42px] w-40 bg-white/20" />
        ) : (
          <div className="mt-1 font-display text-[42px] font-extrabold leading-none">{formatCents(balance.available_cents)}</div>
        )}
        <div className="mt-3 flex gap-[18px] border-t border-white/20 pt-3.5 text-[12px] font-semibold opacity-85">
          <span><b className="opacity-100">{formatCents(balance.escrow_cents)}</b> in escrow</span>
          <span><b className="opacity-100">+{formatCents(monthCredits)}</b> this month</span>
        </div>
      </div>

      <div className="mt-3 flex gap-[9px]">
        <button onClick={() => navigate('/cashout')} className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink">
          <ArrowDown className="h-5 w-5" strokeWidth={2} />
          <span className="text-[12px] font-bold">Cash out</span>
        </button>
        <button className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink">
          <ArrowUp className="h-5 w-5" strokeWidth={2} />
          <span className="text-[12px] font-bold">Add funds</span>
        </button>
      </div>

      <div className="wg-label mt-[22px]">ACTIVITY</div>
      <div className="mt-2.5 flex flex-col gap-[9px] pb-4">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-[13px]" />)
        ) : activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No wallet activity yet.</p>
        ) : (
          activity.map((e) => <Row key={e.id} entry={e} />)
        )}
      </div>
    </div>
  )
}

function Row({ entry }: { entry: LedgerEntry }) {
  const credit = entry.amount_cents >= 0
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
      <span
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-[16px] font-bold"
        style={{ background: credit ? 'hsl(var(--you-tint))' : 'hsl(var(--glyph-bg))', color: credit ? 'hsl(var(--you))' : 'hsl(var(--ink))' }}
      >
        {credit ? '↓' : '↑'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-ink">{entry.description ?? labelFor(entry.type)}</div>
        <div className="mt-px text-[11px] font-medium text-muted-foreground">{format(new Date(entry.created_at), 'MMM d')}</div>
      </div>
      <div className="font-display text-sm font-extrabold tabular-nums" style={{ color: credit ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}>
        {credit ? '+' : '−'}{formatCents(Math.abs(entry.amount_cents))}
      </div>
    </div>
  )
}

function labelFor(type: LedgerEntry['type']) {
  switch (type) {
    case 'winnings': return 'Winnings'
    case 'stake_hold': return 'Stake escrowed'
    case 'stake_release': return 'Stake released'
    case 'refund': return 'Refund'
    case 'cashout': return 'Cashed out'
    case 'cashout_fee': return 'Cash-out fee'
    case 'deposit': return 'Deposit'
    default: return 'Activity'
  }
}

function isThisMonth(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}
