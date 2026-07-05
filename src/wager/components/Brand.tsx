import { cn } from '@/lib/utils'

/**
 * 1v1club brand assets, per the design handoff.
 *
 * - SplitCoin: the mark — a circle split by a diagonal seam, cobalt (`--you`)
 *   over coral (`--rival`) halves, with a center dot ring in `--ink`.
 * - Wordmark: `1v1club` (lowercase, Bricolage 800, tracking -0.03em), two-tone —
 *   `1v1` in `--ink`, `club` in cobalt (`--win`, which is #2f4bff light / #7d8cff
 *   dark for contrast).
 */

export function SplitCoin({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="coin-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <g clipPath="url(#coin-clip)">
        {/* Cobalt half (top-left of the diagonal seam) */}
        <polygon points="0,0 100,0 0,100" fill="hsl(var(--you))" />
        {/* Coral half (bottom-right) */}
        <polygon points="100,0 100,100 0,100" fill="hsl(var(--rival))" />
        {/* Diagonal seam */}
        <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--bg))" strokeWidth="3" />
      </g>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--ink))" strokeWidth="3" />
      {/* Center dot ring */}
      <circle cx="50" cy="50" r="13" fill="hsl(var(--bg))" stroke="hsl(var(--ink))" strokeWidth="3" />
      <circle cx="50" cy="50" r="4.5" fill="hsl(var(--ink))" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('font-display font-extrabold tracking-[-0.03em]', className)}
      style={{ letterSpacing: '-0.03em' }}
    >
      <span className="text-ink">1v1</span>
      <span style={{ color: 'hsl(var(--win))' }}>club</span>
    </span>
  )
}

/** Mark + wordmark lockup. */
export function Brand({
  size = 28,
  textClassName,
  className,
}: {
  size?: number
  textClassName?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <SplitCoin size={size} />
      <Wordmark className={textClassName} />
    </span>
  )
}
