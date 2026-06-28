import { cn } from '@/lib/utils'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import type { SportType } from '../lib/wagerTypes'
import SportGlyph from './SportGlyph'

interface Props {
  value: SportType | undefined
  onChange: (sport: SportType) => void
}

const SPORTS = Object.entries(SPORT_CONFIG) as [SportType, { label: string; emoji: string }][]

export default function SportPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SPORTS.map(([sport, config]) => {
        const selected = value === sport
        return (
          <button
            key={sport}
            type="button"
            onClick={() => onChange(sport)}
            className={cn(
              'flex flex-col items-center gap-[7px] rounded-[14px] border px-1 py-3.5 transition-all',
              selected
                ? 'border-[1.5px] border-you bg-you-tint text-you'
                : 'border-border bg-surface text-ink hover:border-you/50'
            )}
          >
            <SportGlyph sport={sport} size={22} />
            <span className="text-[11px] font-bold leading-tight">{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
