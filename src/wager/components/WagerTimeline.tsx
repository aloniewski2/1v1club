import { formatDistanceToNow } from 'date-fns'
import type { WagerEvent } from '../lib/wagerTypes'

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  created: { label: 'Challenge created', icon: '🏁' },
  winner_declared: { label: 'Winner declared', icon: '🗳️' },
  winner_confirmed: { label: 'Winner confirmed', icon: '✅' },
  forfeit_resolved: { label: 'Won by forfeit', icon: '🏆' },
  voided: { label: 'Match voided — no result', icon: '🚫' },
  disputed: { label: 'Dispute opened', icon: '⚠️' },
  dispute_evidence_submitted: { label: 'Dispute evidence submitted', icon: '📎' },
  dispute_resolved: { label: 'Dispute resolved', icon: '⚖️' },
  proof_reuse_flagged: { label: 'Proof reuse flagged', icon: '🚩' },
  cancelled: { label: 'Challenge cancelled', icon: '❌' },
}

interface Props {
  events: WagerEvent[]
}

export default function WagerTimeline({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium mb-3">Timeline</p>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
        {events.map((event, i) => {
          const config = EVENT_LABELS[event.event_type] ?? { label: event.event_type, icon: '•' }
          return (
            <div key={event.id} className={`relative flex gap-3 pb-4 ${i === events.length - 1 ? 'pb-0' : ''}`}>
              <div className="absolute -left-4 flex h-5 w-5 items-center justify-center text-sm">
                {config.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
