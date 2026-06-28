import { ChevronLeft } from 'lucide-react'

interface Props {
  /** Mono micro-label centered in the header, e.g. "NEW CHALLENGE". */
  label: string
  onBack?: () => void
  /** Optional element pinned to the right (else a spacer keeps the label centered). */
  right?: React.ReactNode
}

/** Shared secondary-screen header: back chevron tile · centered mono label · right slot. */
export default function ScreenHeader({ label, onBack, right }: Props) {
  return (
    <div className="mt-1 flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : (
        <div className="w-[34px]" />
      )}
      <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">{label}</span>
      {right ?? <div className="w-[34px]" />}
    </div>
  )
}
