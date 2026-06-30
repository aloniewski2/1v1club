import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, Play } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatPot, formatCents, calcPayout, buildInviteUrl, initialsOf } from '../lib/wagerUtils'
import { useAuth } from '../hooks/useAuth'
import MatchupBar from '../components/MatchupBar'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

export default function WagerInvite() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="h-28 w-full rounded-[18px]" />
      </div>
    )
  }
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const sport = SPORT_CONFIG[wager.sport]
  const url = buildInviteUrl(wager.invite_token)
  const ranked = wager.mode !== 'casual'
  const categoryLabel = wager.category || wager.custom_sport_label || sport.label

  async function handleCopy() {
    try { await navigator.clipboard.writeText(url) } catch { /* noop */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="INVITE" onBack={() => navigate('/')} />

      <div className="mt-[22px] text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-you-tint">
          <Check className="h-[30px] w-[30px] text-you" strokeWidth={2.5} />
        </div>
        <h1 className="mt-3.5 font-display text-[26px] font-extrabold text-ink">Challenge is live</h1>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          {categoryLabel} · {ranked ? 'ranked · +25 pts to win' : 'casual'}
        </p>
      </div>

      <div className="mt-[22px]">
        <MatchupBar
          height={96}
          seam={28}
          pot={ranked ? '+25 PTS' : 'CASUAL'}
          you={{ name: 'You', initial: initialsOf(profile?.display_name, 1), sub: 'YOU' }}
          rival={{ name: 'Pending', initial: '?', sub: 'NOT JOINED' }}
          rivalPending
        />
      </div>

      <div className="wg-label mt-[22px]">SHARE LINK</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface py-2 pl-3.5 pr-2">
        <span className="flex-1 truncate font-mono text-[13px] font-semibold text-ink">{url.replace(/^https?:\/\//, '')}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-[9px] px-3.5 py-2.5 font-bold text-[hsl(var(--cta-ink))]"
          style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
        >
          <span className="text-xs">{copied ? 'Copied ✓' : 'Copy'}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 px-0.5">
        <span className="h-2 w-2 rounded-full bg-await [animation:wgpulse_1.6s_ease-in-out_infinite]" />
        <span className="text-[12px] font-medium text-muted-foreground">Waiting for your opponent to accept…</span>
      </div>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA onClick={() => navigate(`/${wager.id}`)}>
          <Play className="h-[15px] w-[15px]" fill="currentColor" strokeWidth={0} />
          Go to challenge
        </PrimaryCTA>
        <button
          onClick={() => navigate(`/join/${wager.invite_token}`)}
          className="mt-3 w-full text-center text-[12px] font-semibold"
          style={{ color: 'hsl(var(--win))' }}
        >
          See the invite as your opponent →
        </button>
      </div>
    </div>
  )
}
