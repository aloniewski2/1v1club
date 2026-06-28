import { useNavigate } from 'react-router-dom'
import { CreditCard, Trophy, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useWagers } from '../hooks/useWagers'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { formatCents, calcPayout, initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'
import type { Wager } from '../lib/wagerTypes'

export default function WagerProfile() {
  const { user, profile, signOut } = useAuth()
  const { wagers, loading } = useWagers(user?.id)
  const navigate = useNavigate()

  const settled = wagers.filter((w) => w.status === 'completed')
  const wins = settled.filter((w) => w.confirmed_winner_id === user?.id).length
  const losses = settled.filter((w) => w.confirmed_winner_id && w.confirmed_winner_id !== user?.id).length
  const net = settled.reduce((acc, w) => {
    if (w.confirmed_winner_id === user?.id) return acc + calcPayout(w.wager_amount_cents)
    if (w.confirmed_winner_id) return acc - w.wager_amount_cents
    return acc
  }, 0)

  // streak from most-recent settled
  let streak = 0
  let streakWin = true
  for (const w of settled) {
    const won = w.confirmed_winner_id === user?.id
    if (streak === 0) { streakWin = won; streak = 1 }
    else if (won === streakWin) streak++
    else break
  }

  async function handleSignOut() {
    await signOut()
    navigate('/wager/auth')
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader
        label="YOUR RECORD"
        onBack={() => navigate('/wager')}
        right={
          <button onClick={handleSignOut} aria-label="Sign out" className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        }
      />

      <div className="mt-[18px] flex items-center gap-3.5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-glyph text-[20px] font-bold text-ink">
          {initialsOf(profile?.display_name)}
        </span>
        <div>
          <div className="font-display text-[22px] font-extrabold text-ink">{profile?.display_name ?? 'You'}</div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
            @{profile?.username ?? 'you'} · JOINED {profile?.created_at ? new Date(profile.created_at).getFullYear() : 2025}
          </div>
        </div>
      </div>

      <div className="mt-[18px] flex gap-[9px]">
        <StatCard value={`${wins}–${losses}`} label="RECORD" />
        <StatCard value={`${net >= 0 ? '+' : '−'}${formatCents(Math.abs(net))}`} label="NET · ALL TIME" accent={net >= 0} />
        <StatCard value={streak > 0 ? `${streakWin ? 'W' : 'L'}${streak}` : '—'} label="STREAK" />
      </div>

      {/* Wallet entry (mock balance) */}
      <button
        onClick={() => navigate('/wager/wallet')}
        className="mt-3 flex items-center gap-3.5 rounded-[16px] px-[18px] py-4 text-left text-[hsl(var(--cta-ink))]"
        style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: 'rgba(255,255,255,.16)' }}>
          <CreditCard className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <div className="font-mono text-[11px] font-bold tracking-[0.1em] opacity-75">WALLET BALANCE</div>
          <div className="mt-px font-display text-[22px] font-extrabold">$418.50</div>
        </div>
        <span className="rounded-[9px] px-3.5 py-2.5 text-[12px] font-bold" style={{ background: 'rgba(255,255,255,.16)' }}>Cash out</span>
      </button>

      <div className="mt-[22px] flex items-center justify-between">
        <span className="wg-label">SETTLED</span>
        <button onClick={() => navigate('/wager/leaderboard')} className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.08em]" style={{ color: 'hsl(var(--win))' }}>
          <Trophy className="h-[13px] w-[13px]" strokeWidth={2} />
          LEADERBOARD
        </button>
      </div>

      <div className="mt-2.5 flex flex-col gap-[9px] pb-4">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-[13px]" />)
        ) : settled.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No settled wagers yet.</p>
        ) : (
          settled.map((w) => <SettledRow key={w.id} wager={w} youWon={w.confirmed_winner_id === user?.id} />)
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-[14px] border border-border bg-surface p-3.5">
      <div className="font-display text-[22px] font-extrabold" style={{ color: accent ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] font-bold tracking-[0.1em] text-muted-foreground">{label}</div>
    </div>
  )
}

function SettledRow({ wager, youWon }: { wager: Wager; youWon: boolean }) {
  const sport = SPORT_CONFIG[wager.sport]
  const them = wager.opponent_profile?.display_name ?? wager.creator_profile?.display_name ?? 'Opponent'
  const amt = youWon ? `+${formatCents(calcPayout(wager.wager_amount_cents))}` : `−${formatCents(wager.wager_amount_cents)}`
  const bar = youWon
    ? 'linear-gradient(hsl(var(--you)) 0 50%, hsl(var(--rival)) 50% 100%)'
    : 'linear-gradient(hsl(var(--rival)) 0 50%, hsl(var(--you)) 50% 100%)'
  return (
    <div className="flex items-center gap-[11px] rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
      <span className="w-1 self-stretch rounded" style={{ background: bar }} />
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-glyph text-[14px] font-bold text-ink">{sport.label[0]}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-ink">{sport.label}</div>
        <div className="mt-px text-[11px] font-medium text-muted-foreground">
          vs {them}{wager.completed_at ? ` · ${format(new Date(wager.completed_at), 'MMM d')}` : ''}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-sm font-extrabold tabular-nums" style={{ color: youWon ? 'hsl(var(--win))' : 'hsl(var(--rival))' }}>{amt}</div>
        <div className="mt-px font-mono text-[9px] font-bold tracking-[0.06em] text-muted-foreground">{youWon ? 'WON' : 'LOST'}</div>
      </div>
    </div>
  )
}
