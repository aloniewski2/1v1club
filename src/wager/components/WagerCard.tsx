import { useNavigate } from 'react-router-dom'
import type { Wager } from '../lib/wagerTypes'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatPot } from '../lib/wagerUtils'
import StatusBadge from './StatusBadge'
import SportGlyph from './SportGlyph'

interface Props {
  wager: Wager
  currentUserId: string
}

const AWAITING_STATUSES = ['pending_payment', 'awaiting_opponent']

export default function WagerCard({ wager, currentUserId }: Props) {
  const navigate = useNavigate()
  const sport = SPORT_CONFIG[wager.sport]
  const isCreator = wager.created_by === currentUserId
  const opponent = isCreator ? wager.opponent_profile : wager.creator_profile

  // Second gradient stop is grey while we're still waiting on the opponent.
  const lowerStop = AWAITING_STATUSES.includes(wager.status) ? 'var(--await)' : 'var(--rival)'

  return (
    <button
      onClick={() => navigate(`/wager/${wager.id}`)}
      className="flex w-full items-center gap-[11px] rounded-[13px] border border-border bg-surface px-[13px] py-[11px] text-left transition-colors hover:border-you/40"
    >
      <span
        className="w-1 self-stretch rounded"
        style={{ background: 'linear-gradient(hsl(var(--you)) 0 50%, hsl(' + lowerStop + ') 50% 100%)' }}
      />
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-glyph text-ink">
        <SportGlyph sport={wager.sport} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-[7px]">
          <span className="text-sm font-bold text-ink">{sport.label}</span>
          <StatusBadge status={wager.status} className="rounded-[5px] px-1.5 py-0.5" />
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
          {opponent ? `vs ${opponent.display_name} · ` : ''}
          {wager.description}
        </span>
      </span>
      <span className="font-display text-sm font-extrabold tabular-nums text-ink">
        {formatPot(wager.wager_amount_cents)}
      </span>
    </button>
  )
}
