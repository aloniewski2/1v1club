import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import ScreenHeader from '../components/ScreenHeader'
import { cn } from '@/lib/utils'

/** Leaderboard / Friends — UI only; ranks are placeholders (no friends backend yet). */
const PODIUM = [
  { rank: 2, av: 'DR', name: 'Dev', net: '+$180', h: 48 },
  { rank: 1, av: 'MB', name: 'You', net: '+$240', h: 72, me: true },
  { rank: 3, av: 'SK', name: 'Sam', net: '+$60', h: 36 },
]
const RANKED = [
  { rank: '1', av: 'MB', avBg: 'var(--you)', name: 'You', record: '7–2 · 78% win rate', net: '+$240', net_c: 'var(--win)', me: true },
  { rank: '2', av: 'DR', avBg: '#1f8a5b', name: 'Dev R.', record: '9–5 · 64% win rate', net: '+$180', net_c: 'var(--ink)' },
  { rank: '3', av: 'SK', avBg: '#7c5cff', name: 'Sam K.', record: '5–4 · 56% win rate', net: '+$60', net_c: 'var(--ink)' },
  { rank: '4', av: 'TJ', avBg: 'var(--rival)', name: 'Tyler J.', record: '6–7 · 46% win rate', net: '−$110', net_c: 'var(--rival)' },
]

export default function WagerLeaderboard() {
  const navigate = useNavigate()
  const [metric, setMetric] = useState<'net' | 'rate'>('net')

  return (
    <div className="flex flex-col">
      <ScreenHeader
        label="FRIENDS"
        onBack={() => navigate('/wager/profile')}
        right={
          <button onClick={() => navigate('/wager/friends')} aria-label="Add friend" className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">
            <UserPlus className="h-[17px] w-[17px]" strokeWidth={2} />
          </button>
        }
      />

      <h1 className="mt-4 font-display text-[26px] font-extrabold text-ink">This month</h1>
      <div className="mt-3.5 flex gap-0.5 rounded-[11px] p-[3px]" style={{ background: 'hsl(var(--toggle-track))' }}>
        <button onClick={() => setMetric('net')} className={cn('flex-1 rounded-lg py-2 text-center text-[11px] font-bold', metric === 'net' ? 'bg-ink text-background' : 'text-muted-foreground')}>Net winnings</button>
        <button onClick={() => setMetric('rate')} className={cn('flex-1 rounded-lg py-2 text-center text-[11px] font-bold', metric === 'rate' ? 'bg-ink text-background' : 'text-muted-foreground')}>Win rate</button>
      </div>

      {/* Podium */}
      <div className="mt-[18px] flex items-end gap-2">
        {PODIUM.map((p) => (
          <div key={p.rank} className="flex-1 text-center">
            <span
              className={cn('mx-auto flex items-center justify-center rounded-full font-bold', p.me ? 'h-14 w-14 text-[19px] text-white' : 'h-12 w-12 text-[17px] text-ink')}
              style={p.me ? { background: 'hsl(var(--you))', boxShadow: 'var(--pot-shadow)' } : { background: 'hsl(var(--glyph-bg))', border: '2px solid hsl(var(--muted-foreground))' }}
            >
              {p.av}
            </span>
            <div className={cn('mt-[7px] font-bold', p.me ? 'text-[13px]' : 'text-[12px]', 'text-ink')}>{p.name}</div>
            <div className="font-mono text-[11px] font-bold" style={{ color: p.me ? 'hsl(var(--win))' : 'hsl(var(--muted-foreground))' }}>{p.net}</div>
            <div
              className="mt-2 flex items-start justify-center rounded-t-[10px] pt-2 font-display font-extrabold"
              style={{
                height: p.h,
                background: p.me ? 'hsl(var(--you-tint))' : 'hsl(var(--surface))',
                border: `${p.me ? 1.5 : 1}px solid ${p.me ? 'hsl(var(--you))' : 'hsl(var(--border))'}`,
                borderBottom: 'none',
                color: p.me ? 'hsl(var(--you))' : 'hsl(var(--muted-foreground))',
                fontSize: p.me ? 20 : 16,
              }}
            >
              {p.rank}
            </div>
          </div>
        ))}
      </div>
      <div className="h-px bg-border" />

      <div className="mt-4 flex flex-col gap-[9px] pb-4">
        {RANKED.map((p) => (
          <div
            key={p.rank}
            className="flex items-center gap-3 rounded-[13px] px-[13px] py-[11px]"
            style={{ background: p.me ? 'hsl(var(--you-tint))' : 'hsl(var(--surface))', border: `1px solid ${p.me ? 'hsl(var(--you))' : 'hsl(var(--border))'}` }}
          >
            <span className="w-[18px] text-center font-display text-[14px] font-extrabold text-muted-foreground">{p.rank}</span>
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: p.avBg.startsWith('var') ? `hsl(${p.avBg})` : p.avBg }}>{p.av}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-ink">{p.name}</div>
              <div className="mt-px text-[11px] font-medium text-muted-foreground">{p.record}</div>
            </div>
            <div className="font-display text-[14px] font-extrabold tabular-nums" style={{ color: `hsl(${p.net_c})` }}>{p.net}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
