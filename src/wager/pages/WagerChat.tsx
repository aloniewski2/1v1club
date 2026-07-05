import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { useAuth } from '../hooks/useAuth'
import { useWagerChat } from '../hooks/useWagerChat'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatPot, initialsOf } from '../lib/wagerUtils'
import SportGlyph from '../components/SportGlyph'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function WagerChat() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { messages, loading: chatLoading, sendMessage } = useWagerChat(id)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) return <Skeleton className="mt-10 h-[60vh] w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const them = isCreator ? wager.opponent_profile : wager.creator_profile
  const sport = SPORT_CONFIG[wager.sport]

  async function send() {
    const t = draft.trim()
    if (!t) return
    setDraft('')
    await sendMessage(t)
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* Header */}
      <div className="-mx-5 flex items-center gap-3 border-b border-border px-5 pb-3 pt-1">
        <button onClick={() => navigate(`/${id}`)} className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--rival))' }}>
          {initialsOf(them?.display_name, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{them?.display_name ?? 'Opponent'}</div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {sport.label.toUpperCase()} · {wager.mode === 'casual' ? 'CASUAL' : 'RANKED'} · LIVE
          </div>
        </div>
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
          <SportGlyph sport={wager.sport} size={17} />
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-4">
        <div className="mb-0.5 text-center font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">
          CHALLENGE ACCEPTED · {wager.mode === 'casual' ? 'CASUAL' : 'RANKED'}
        </div>
        {chatLoading && (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-9 w-48 self-start rounded-[16px_16px_16px_4px]" />
            <Skeleton className="h-9 w-36 self-end rounded-[16px_16px_4px_16px]" />
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === user?.id
          return (
            <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div
                className={cn('max-w-[76%] px-3.5 py-2.5 text-[13px] font-medium leading-[1.4]', isMe ? 'text-white' : 'border border-border text-ink')}
                style={{
                  background: isMe ? 'hsl(var(--you))' : 'hsl(var(--surface))',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}
              >
                {m.body}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
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
