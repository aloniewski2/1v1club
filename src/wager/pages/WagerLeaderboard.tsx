import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Crown } from 'lucide-react'
import { useLeaderboard, type LeaderboardRow } from '../hooks/useLeaderboard'
import { initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Per-rank styling. #1 rides the brand cobalt; #2/#3 read as silver/bronze
// tiers via neutral + amber, all from theme tokens so both themes hold up.
const RANK = {
  1: { h: 96, avatar: 60, ring: 'hsl(var(--you))', pedTint: 'hsl(var(--you-tint))', pedBorder: 'hsl(var(--you))', num: 'hsl(var(--you))' },
  2: { h: 66, avatar: 48, ring: 'hsl(var(--muted-foreground))', pedTint: 'hsl(var(--surface))', pedBorder: 'hsl(var(--border))', num: 'hsl(var(--muted-foreground))' },
  3: { h: 50, avatar: 48, ring: 'hsl(var(--amber, 38 92% 50%))', pedTint: 'hsl(var(--surface))', pedBorder: 'hsl(var(--border))', num: 'hsl(var(--amber, 38 92% 50%))' },
} as const

export default function WagerLeaderboard() {
  const navigate = useNavigate()
  const [metric, setMetric] = useState<'net' | 'rate'>('net')
  const { rows, loading } = useLeaderboard(metric)

  // Podium order: #2 left, #1 center, #3 right.
  const podiumOrder = rows.length >= 3 ? [rows[1], rows[0], rows[2]] : rows

  return (
    <div className="flex flex-col">
      <ScreenHeader
        label="FRIENDS"
        onBack={() => navigate('/profile')}
        right={
          <button onClick={() => navigate('/friends')} aria-label="Add friend" className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
            <UserPlus className="h-[17px] w-[17px]" strokeWidth={2} />
          </button>
        }
      />

      <h1 className="mt-4 font-display text-[26px] font-extrabold text-ink">This month</h1>
      <div className="mt-3.5 flex gap-0.5 rounded-[11px] p-[3px]" style={{ background: 'hsl(var(--toggle-track))' }}>
        <button onClick={() => setMetric('net')} className={cn('flex-1 rounded-lg py-2 text-center text-[11px] font-bold', metric === 'net' ? 'bg-ink text-background' : 'text-muted-foreground')}>Points</button>
        <button onClick={() => setMetric('rate')} className={cn('flex-1 rounded-lg py-2 text-center text-[11px] font-bold', metric === 'rate' ? 'bg-ink text-background' : 'text-muted-foreground')}>Win rate</button>
      </div>

      {loading ? (
        <div className="mt-5 flex flex-col gap-[9px]">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-[13px]" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Add friends to see how you stack up.
        </p>
      ) : (
        <>
          {/* Podium */}
          {podiumOrder.length >= 3 && (
            <>
              <div className="mt-6 flex items-end gap-2.5">
                {podiumOrder.map((p, i) => {
                  const rank = (i === 0 ? 2 : i === 1 ? 1 : 3) as 1 | 2 | 3
                  const r = RANK[rank]
                  const me = p.is_me
                  return (
                    <div key={p.user_id} className="flex flex-1 flex-col items-center text-center">
                      {/* Crown only over #1 */}
                      <Crown
                        className="mb-1 h-[18px] w-[18px]"
                        strokeWidth={2.5}
                        style={{ color: r.ring, opacity: rank === 1 ? 1 : 0 }}
                        fill={rank === 1 ? r.ring : 'none'}
                      />
                      <div className="relative">
                        <span
                          className="flex items-center justify-center rounded-full font-bold text-white"
                          style={{
                            height: r.avatar, width: r.avatar,
                            fontSize: rank === 1 ? 22 : 17,
                            background: me ? 'hsl(var(--you))' : 'hsl(var(--rival))',
                            boxShadow: rank === 1 ? 'var(--pot-shadow)' : 'none',
                            outline: `2.5px solid ${r.ring}`, outlineOffset: 2,
                          }}
                        >
                          {initialsOf(p.display_name)}
                        </span>
                        {/* Medal rank badge */}
                        <span
                          className="absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full font-display text-[12px] font-extrabold text-white"
                          style={{ background: r.ring, border: '2px solid hsl(var(--bg, var(--background)))' }}
                        >
                          {rank}
                        </span>
                      </div>
                      <div className={cn('mt-2 truncate font-bold text-ink', rank === 1 ? 'text-[13px]' : 'text-[12px]')} style={{ maxWidth: '100%' }}>
                        {me ? 'You' : firstName(p.display_name)}
                      </div>
                      <div className="font-mono text-[11px] font-bold" style={{ color: me ? 'hsl(var(--win))' : 'hsl(var(--muted-foreground))' }}>
                        {metricValue(p, metric)}
                      </div>
                      {/* Pedestal */}
                      <div
                        className="mt-2 w-full rounded-t-[12px]"
                        style={{
                          height: r.h,
                          background: me ? r.pedTint : 'hsl(var(--surface))',
                          border: `${me ? 1.5 : 1}px solid ${me ? 'hsl(var(--you))' : r.pedBorder}`,
                          borderBottom: 'none',
                          boxShadow: rank === 1 ? 'inset 0 2px 0 hsl(var(--you) / .25)' : 'none',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="h-px bg-border" />
            </>
          )}

          <div className="mt-4 flex flex-col gap-[9px] pb-4">
            {rows.map((p, i) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-[13px] px-[13px] py-[11px]"
                style={{ background: p.is_me ? 'hsl(var(--you-tint))' : 'hsl(var(--surface))', border: `1px solid ${p.is_me ? 'hsl(var(--you))' : 'hsl(var(--border))'}` }}
              >
                <span className="w-[18px] text-center font-display text-[14px] font-extrabold text-muted-foreground">{i + 1}</span>
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: p.is_me ? 'hsl(var(--you))' : 'hsl(var(--rival))' }}>{initialsOf(p.display_name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{p.is_me ? 'You' : p.display_name}</div>
                  <div className="mt-px text-[11px] font-medium text-muted-foreground">{p.wins}–{p.losses} · {p.win_rate}% win rate</div>
                </div>
                <div className="font-display text-[14px] font-extrabold tabular-nums" style={{ color: p.net_cents >= 0 ? (p.is_me ? 'hsl(var(--win))' : 'hsl(var(--ink))') : 'hsl(var(--rival))' }}>
                  {metricValue(p, metric)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function metricValue(p: LeaderboardRow, metric: 'net' | 'rate') {
  if (metric === 'rate') return `${p.win_rate}%`
  return `${p.net_cents} pts`
}

function firstName(name: string) {
  return name.split(' ')[0]
}
