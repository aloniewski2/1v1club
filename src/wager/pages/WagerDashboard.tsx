import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWagers } from '../hooks/useWagers'
import { useNotifications } from '../hooks/useNotifications'
import WagerCard from '../components/WagerCard'
import MatchupBar from '../components/MatchupBar'
import SportGlyph from '../components/SportGlyph'
import StatusBadge from '../components/StatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import PrimaryCTA from '../components/PrimaryCTA'
import ConnectOnboardingBanner from '../components/ConnectOnboardingBanner'
import { Skeleton } from '@/components/ui/skeleton'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatPot, formatCents } from '../lib/wagerUtils'
import { initialsOf, sumPot } from '../lib/wagerUtils'
import type { Wager } from '../lib/wagerTypes'
import { cn } from '@/lib/utils'

const ACTIVE_STATUSES = ['active', 'declaring', 'disputed']
const PENDING_STATUSES = ['pending_payment', 'awaiting_opponent', 'opponent_joined']
const DONE_STATUSES = ['completed', 'cancelled', 'refunded']

export default function WagerDashboard() {
  const { user, profile } = useAuth()
  const { wagers, loading } = useWagers(user?.id)
  const { unreadCount } = useNotifications(profile?.id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'pending' | 'history'>('pending')

  const active = wagers.filter((w: Wager) => ACTIVE_STATUSES.includes(w.status))
  const pending = wagers.filter((w: Wager) => PENDING_STATUSES.includes(w.status))
  const done = wagers.filter((w: Wager) => DONE_STATUSES.includes(w.status))

  const completed = done.filter((w) => w.status === 'completed')
  const wins = completed.filter((w) => w.confirmed_winner_id === user?.id).length
  const losses = completed.filter((w) => w.confirmed_winner_id && w.confirmed_winner_id !== user?.id).length
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const inPlay = sumPot(active)

  const live = active[0]
  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'
  const initials = initialsOf(profile?.display_name)
  const dateLabel = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·')

  const rows = tab === 'pending' ? pending : done

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted-foreground">{dateLabel}</div>
          <h1 className="mt-0.5 font-display text-[25px] font-extrabold text-ink">Evening, {firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/wager/notifications')}
            aria-label="Notifications"
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-glyph"
          >
            <Bell className="h-[19px] w-[19px]" strokeWidth={2} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-px -top-px flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white"
                style={{ background: 'hsl(var(--rival))', border: '2px solid hsl(var(--background))' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <ThemeToggle />
          <button onClick={() => navigate('/wager/profile')} aria-label="Profile">
            <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-glyph text-[15px] font-bold text-ink">
              {initials}
            </span>
          </button>
        </div>
      </div>

      {profile && !profile.stripe_account_ready && (
        <div className="mt-4">
          <ConnectOnboardingBanner />
        </div>
      )}

      {/* Live now */}
      {loading ? (
        <Skeleton className="mt-5 h-[200px] w-full rounded-[18px]" />
      ) : live ? (
        <>
          <div className="mt-5 font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground">// LIVE NOW</div>
          <LiveWagerCard wager={live} currentUserId={user!.id} onOpen={() => navigate(`/wager/${live.id}`)} />
        </>
      ) : null}

      {/* Stats strip */}
      <div className="mt-3 flex rounded-[14px] border border-border bg-surface">
        <Stat value={`${wins}–${losses}`} label="RECORD" />
        <Stat value={formatCents(inPlay)} label="IN PLAY" bordered />
        <Stat value={`${winRate}%`} label="WIN RATE" accent bordered />
      </div>

      {/* Your wagers */}
      <div className="mt-[18px] flex items-center justify-between">
        <span className="font-display text-[15px] font-extrabold text-ink">Your wagers</span>
        <div className="flex gap-1.5 font-mono text-[10px] font-bold tracking-[0.06em]">
          <button
            onClick={() => setTab('pending')}
            className={cn(
              'rounded-[7px] px-2.5 py-1.5',
              tab === 'pending' ? 'bg-ink text-background' : 'text-muted-foreground'
            )}
          >
            PENDING
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              'rounded-[7px] px-2.5 py-1.5',
              tab === 'history' ? 'bg-ink text-background' : 'text-muted-foreground'
            )}
          >
            HISTORY
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-[9px]">
        {loading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-[62px] w-full rounded-[13px]" />)
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {tab === 'pending' ? 'No pending wagers.' : 'No settled wagers yet.'}
          </p>
        ) : (
          rows.map((w: Wager) => <WagerCard key={w.id} wager={w} currentUserId={user!.id} />)
        )}
      </div>

      {/* CTA */}
      <div className="mt-4">
        <PrimaryCTA onClick={() => navigate('/wager/create')}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New challenge
        </PrimaryCTA>
      </div>
    </div>
  )
}

function Stat({ value, label, accent, bordered }: { value: string; label: string; accent?: boolean; bordered?: boolean }) {
  return (
    <div className={cn('flex-1 px-3.5 py-[11px]', bordered && 'border-l border-border')}>
      <div
        className="text-[17px] font-bold tabular-nums"
        style={{ color: accent ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}
      >
        {value}
      </div>
      <div className="mt-px font-mono text-[9px] font-bold tracking-[0.1em] text-muted-foreground">{label}</div>
    </div>
  )
}

function LiveWagerCard({ wager, currentUserId, onOpen }: { wager: Wager; currentUserId: string; onOpen: () => void }) {
  const sport = SPORT_CONFIG[wager.sport]
  const isCreator = wager.created_by === currentUserId
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile

  return (
    <button
      onClick={onOpen}
      className="mt-[9px] w-full rounded-[18px] border border-border bg-surface p-[15px] text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <SportGlyph sport={wager.sport} size={18} />
          <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-muted-foreground">
            {sport.label.toUpperCase()}
          </span>
        </div>
        <StatusBadge status={wager.status} />
      </div>
      <div className="mt-3">
        <MatchupBar
          height={90}
          seam={26}
          bordered={false}
          pot={formatPot(wager.wager_amount_cents)}
          you={{ name: 'You', initial: initialsOf(me?.display_name, 1), sub: 'PAID' }}
          rival={{ name: them?.display_name ?? 'Opponent', initial: initialsOf(them?.display_name, 1), sub: 'PAID' }}
        />
      </div>
      <div className="mt-[11px] text-[13px] font-medium text-ink/80">{wager.description}</div>
    </button>
  )
}
