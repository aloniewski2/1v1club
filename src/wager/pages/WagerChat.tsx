import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { useAuth } from '../hooks/useAuth'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatPot, initialsOf } from '../lib/wagerUtils'
import SportGlyph from '../components/SportGlyph'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Msg { who: 'me' | 'them'; text: string }

const SEED: Msg[] = [
  { who: 'them', text: "You sure about this? I've been practicing 🏌️" },
  { who: 'me', text: 'Practicing losing, maybe' },
  { who: 'them', text: 'Bold words for $50 on the line' },
  { who: 'me', text: "Loser buys dinner too, don't forget" },
  { who: 'them', text: 'hope you brought your wallet 😏' },
]

export default function WagerChat() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>(SEED)
  const [draft, setDraft] = useState('')

  if (loading) return <Skeleton className="mt-10 h-[60vh] w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const them = isCreator ? wager.opponent_profile : wager.creator_profile
  const sport = SPORT_CONFIG[wager.sport]

  function send() {
    const t = draft.trim()
    if (!t) return
    setMessages((m) => [...m, { who: 'me', text: t }])
    setDraft('')
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* Header */}
      <div className="-mx-5 flex items-center gap-3 border-b border-border px-5 pb-3 pt-1">
        <button onClick={() => navigate(`/wager/${id}`)} className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--rival))' }}>
          {initialsOf(them?.display_name, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{them?.display_name ?? 'Opponent'}</div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {sport.label.toUpperCase()} · {formatPot(wager.wager_amount_cents)} POT · LIVE
          </div>
        </div>
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
          <SportGlyph sport={wager.sport} size={17} />
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-4">
        <div className="mb-0.5 text-center font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">
          WAGER ACCEPTED · {formatPot(wager.wager_amount_cents)} POT
        </div>
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.who === 'me' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn('max-w-[76%] px-3.5 py-2.5 text-[13px] font-medium leading-[1.4]', m.who === 'me' ? 'text-white' : 'border border-border text-ink')}
              style={{
                background: m.who === 'me' ? 'hsl(var(--you))' : 'hsl(var(--surface))',
                borderRadius: m.who === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 self-start px-0.5 py-1">
          <div className="flex gap-[3px] rounded-[14px] border border-border bg-surface px-3 py-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground [animation:wgpulse_1.2s_ease-in-out_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground [animation:wgpulse_1.2s_ease-in-out_.2s_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground [animation:wgpulse_1.2s_ease-in-out_.4s_infinite]" />
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="-mx-5 flex items-center gap-2.5 border-t border-border px-5 pb-2 pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Send a message…"
          className="flex-1 rounded-[20px] border border-border bg-surface px-4 py-3 text-[13px] font-medium text-ink outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[hsl(var(--cta-ink))]"
          style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
        >
          <Send className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
