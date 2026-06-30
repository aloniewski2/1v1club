import { cn } from '@/lib/utils'

interface Side {
  name: string
  initial: string
  /** Mono micro-label under the name, e.g. "PAID $50" / "PAY $50" / "WON $95". */
  sub?: string
  /** Identity tint opacity (used to dim the loser on payout). */
  opacity?: number
}

interface Props {
  you: Side
  rival: Side
  pot: string
  /** Bar height in px (handoff uses 90 on cards, 112 on detail, 96–104 elsewhere). */
  height?: number
  /** Diagonal seam offset in px. */
  seam?: number
  /** Renders the rival side in "awaiting" styling with a dashed "?" avatar. */
  rivalPending?: boolean
  /** Pot coin diameter in px. */
  potSize?: number
  bordered?: boolean
  className?: string
}

/**
 * Signature 1v1 Club component — a horizontal bar split by a diagonal seam with
 * the pot rendered as a centered circular "coin". You = cobalt, rival = coral.
 */
export default function MatchupBar({
  you,
  rival,
  pot,
  height = 112,
  seam = 28,
  rivalPending = false,
  potSize,
  bordered = true,
  className,
}: Props) {
  const coin = potSize ?? Math.round(height * 0.59)
  const avatar = Math.round(height * 0.41)

  return (
    <div
      className={cn('relative overflow-hidden rounded-[18px]', bordered && 'border border-border', className)}
      style={{ height }}
    >
      {/* You (left) */}
      <div
        className="absolute inset-y-0 left-0 flex items-center gap-3 px-[18px]"
        style={{
          width: '58%',
          background: 'hsl(var(--you-tint))',
          clipPath: `polygon(0 0,100% 0,calc(100% - ${seam}px) 100%,0 100%)`,
          opacity: you.opacity ?? 1,
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
          style={{ width: avatar, height: avatar, background: 'hsl(var(--you))', fontSize: avatar * 0.4 }}
        >
          {you.initial}
        </div>
        <div className="min-w-0">
          <div className="truncate font-bold text-[15px] text-ink">{you.name}</div>
          {you.sub && (
            <div className="wg-label mt-px text-[8px] tracking-[0.08em]" style={{ color: 'hsl(var(--win))' }}>
              {you.sub}
            </div>
          )}
        </div>
      </div>

      {/* Rival (right) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end gap-3 px-[18px]"
        style={{
          left: '42%',
          background: rivalPending ? 'hsl(var(--await-bg))' : 'hsl(var(--rival-tint))',
          clipPath: `polygon(${seam}px 0,100% 0,100% 100%,0 100%)`,
          opacity: rival.opacity ?? 1,
        }}
      >
        <div className="min-w-0 text-right">
          <div
            className="truncate font-bold text-[15px]"
            style={{ color: rivalPending ? 'hsl(var(--muted-foreground))' : 'hsl(var(--ink))' }}
          >
            {rival.name}
          </div>
          {rival.sub && (
            <div
              className="wg-label mt-px text-[8px] tracking-[0.08em]"
              style={{ color: rivalPending ? 'hsl(var(--muted-foreground))' : 'hsl(var(--rival))' }}
            >
              {rival.sub}
            </div>
          )}
        </div>
        <div
          className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
          style={{
            width: avatar,
            height: avatar,
            fontSize: avatar * 0.4,
            background: rivalPending ? 'hsl(var(--glyph-bg))' : 'hsl(var(--rival))',
            color: rivalPending ? 'hsl(var(--muted-foreground))' : '#fff',
            border: rivalPending ? '1.5px dashed hsl(var(--muted-foreground))' : 'none',
          }}
        >
          {rival.initial}
        </div>
      </div>

      {/* Pot coin */}
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full"
        style={{
          width: coin,
          height: coin,
          background: 'hsl(var(--pot-bg))',
          color: 'hsl(var(--pot-ink))',
          boxShadow: 'var(--pot-shadow)',
          border: '3px solid hsl(var(--pot-border))',
        }}
      >
        <div className="font-display font-extrabold leading-none" style={{ fontSize: coin * 0.26 }}>
          {pot}
        </div>
        <div className="wg-label" style={{ fontSize: 7, letterSpacing: '0.12em', color: 'hsl(var(--pot-sub))' }}>
          POT
        </div>
      </div>
    </div>
  )
}
