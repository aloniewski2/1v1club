import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import ScreenHeader from '../components/ScreenHeader'
import { cn } from '@/lib/utils'

/** Add Friend — UI only; results are placeholders (no friends/social backend yet). */
const RESULTS = [
  { av: 'JM', avBg: 'var(--you)', name: 'Jordan M.', handle: '@jordanm', mutual: '3 mutual', sent: false },
  { av: 'JL', avBg: '#1f8a5b', name: 'Jordan Lee', handle: '@jlee', mutual: '1 mutual', sent: false },
  { av: 'JC', avBg: '#7c5cff', name: 'Jordan Cole', handle: '@jcole22', mutual: 'No mutuals', sent: true },
]

export default function WagerAddFriend() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('jordan')
  const [adds, setAdds] = useState<Record<string, boolean>>({})

  return (
    <div className="flex flex-col">
      <ScreenHeader label="ADD FRIENDS" onBack={() => navigate('/wager/leaderboard')} />

      <div className="mt-4 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        <Search className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={2} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or @handle" className="flex-1 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted-foreground" />
      </div>

      <div className="wg-label mt-[22px]">RESULTS</div>
      <div className="mt-2.5 flex flex-col gap-[9px]">
        {RESULTS.map((s) => {
          const requested = adds[s.handle] || s.sent
          return (
            <div key={s.handle} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: s.avBg.startsWith('var') ? `hsl(${s.avBg})` : s.avBg }}>{s.av}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink">{s.name}</div>
                <div className="mt-px text-[11px] font-medium text-muted-foreground">{s.handle} · {s.mutual}</div>
              </div>
              <button
                onClick={() => !requested && setAdds((a) => ({ ...a, [s.handle]: true }))}
                disabled={requested}
                className={cn('shrink-0 rounded-[9px] px-3.5 py-2 text-[12px] font-bold', requested ? 'cursor-default border border-border bg-surface text-muted-foreground' : 'text-[hsl(var(--cta-ink))]')}
                style={requested ? undefined : { background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
              >
                {requested ? 'Requested' : 'Add'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="wg-label mt-[22px]">INVITE OFF-APP</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface py-2 pl-3.5 pr-2">
        <Send className="h-[17px] w-[17px] shrink-0 text-muted-foreground" strokeWidth={2} />
        <span className="flex-1 truncate text-[13px] font-semibold text-ink">wagerly.gg/i/you</span>
        <button onClick={() => toast.success('Invite link copied.')} className="shrink-0 rounded-[9px] px-3.5 py-2.5 text-[12px] font-bold text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}>
          Share
        </button>
      </div>
    </div>
  )
}
