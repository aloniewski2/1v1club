import {
  Dribbble,
  Gamepad2,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { SportType } from '../lib/wagerTypes'

interface Props {
  sport: SportType
  size?: number
  className?: string
}

/**
 * Monoline sport glyphs (stroke-width 2, round caps/joins) — the four core
 * sports use the custom SVGs from the design handoff; the rest fall back to
 * matching Lucide monoline icons so every glyph keeps the same weight.
 */
export default function SportGlyph({ sport, size = 19, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }

  switch (sport) {
    case 'golf':
      return (
        <svg {...common}>
          <path d="M7 21V4" />
          <path d="M7 4h9l-2.5 3L16 10H7" />
        </svg>
      )
    case 'tennis':
    case 'pickleball':
    case 'ping_pong':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5.5 6.5c3.5 2.5 3.5 8.5 0 11M18.5 6.5c-3.5 2.5-3.5 8.5 0 11" />
        </svg>
      )
    case 'chess':
      return (
        <svg {...common}>
          <circle cx="12" cy="6" r="3" />
          <path d="M9.5 9c-.5 2-1.5 3-1.5 5h8c0-2-1-3-1.5-5" />
          <path d="M8 17h8l.7 4H7.3z" />
        </svg>
      )
    case 'pool':
      return (
        <svg {...common} strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
        </svg>
      )
    default: {
      const Fallback: LucideIcon =
        sport === 'basketball'
          ? Dribbble
          : sport === 'gaming'
          ? Gamepad2
          : sport === 'darts'
          ? Target
          : Trophy
      return <Fallback size={size} className={className} strokeWidth={2} />
    }
  }
}
