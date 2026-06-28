import { cn } from '@/lib/utils'
import type { WagerStatus } from '../lib/wagerTypes'

interface Props {
  status: WagerStatus
  className?: string
}

type Tone = 'live' | 'amber' | 'await' | 'rival' | 'win'

const TAG: Record<WagerStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: 'PENDING', tone: 'await' },
  awaiting_opponent: { label: 'AWAITING', tone: 'await' },
  opponent_joined: { label: 'JOINED', tone: 'win' },
  active: { label: 'LIVE', tone: 'live' },
  declaring: { label: 'DECLARING', tone: 'amber' },
  disputed: { label: 'UNDER REVIEW', tone: 'rival' },
  completed: { label: 'SETTLED', tone: 'win' },
  cancelled: { label: 'CANCELLED', tone: 'await' },
  refunded: { label: 'REFUNDED', tone: 'await' },
}

const TONE: Record<Tone, { color: string; bg: string }> = {
  live: { color: 'hsl(var(--win))', bg: 'hsl(var(--you-tint))' },
  amber: { color: 'hsl(var(--amber))', bg: 'hsl(var(--amber-bg) / 0.16)' },
  await: { color: 'hsl(var(--await))', bg: 'hsl(var(--await-bg))' },
  rival: { color: 'hsl(var(--rival))', bg: 'hsl(var(--rival-tint))' },
  win: { color: 'hsl(var(--win))', bg: 'hsl(var(--you-tint))' },
}

export default function StatusBadge({ status, className }: Props) {
  const { label, tone } = TAG[status]
  const { color, bg } = TONE[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.08em]',
        className
      )}
      style={{ color, background: bg }}
    >
      {tone === 'live' && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: 'hsl(var(--you))', boxShadow: 'var(--dot-glow)' }}
        />
      )}
      {label}
    </span>
  )
}
