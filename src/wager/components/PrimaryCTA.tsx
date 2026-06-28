import { cn } from '@/lib/utils'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

/**
 * Full-width primary CTA — ink-black in light, glowing cobalt in dark.
 * Disabled state matches the handoff (surface bg, muted text, hairline border).
 */
export default function PrimaryCTA({ children, className, disabled, ...props }: Props) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-4 font-display text-[15px] font-extrabold transition-opacity',
        disabled
          ? 'cursor-default border border-border bg-surface text-muted-foreground'
          : 'text-[hsl(var(--cta-ink))] hover:opacity-95',
        className
      )}
      style={disabled ? undefined : { background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
      {...props}
    >
      {children}
    </button>
  )
}
