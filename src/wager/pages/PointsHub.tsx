import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ArrowDownLeft, ArrowUpRight, History as HistoryIcon, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface LedgerRow {
  id: string
  type: string
  amount: number
  description: string | null
  created_at: string
}

export default function PointsHub() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('points_ledger')
      .select('id, type, amount, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setRows((data as LedgerRow[]) ?? [])
        setLoading(false)
      })
  }, [user])

  const balance = profile?.points ?? 0
  const escrowed = profile?.points_escrowed ?? 0
  const available = balance - escrowed

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="POINTS" onBack={() => navigate('/profile')} />

      {/* Balance card */}
      <div
        className="mt-4 rounded-[20px] px-[18px] py-5 text-[hsl(var(--cta-ink))]"
        style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
      >
        <div className="font-mono text-[11px] font-bold tracking-[0.1em] opacity-75">SEASON POINTS</div>
        <div className="mt-1 font-display text-[42px] font-extrabold leading-none">
          {balance.toLocaleString()} <span className="text-[18px]">PTS</span>
        </div>
        <div className="mt-3 flex gap-4 border-t pt-3 text-[12px] font-medium opacity-90" style={{ borderColor: 'rgba(255,255,255,.18)' }}>
          <span><strong>{available.toLocaleString()}</strong> available</span>
          {escrowed > 0 && <span><strong>{escrowed.toLocaleString()}</strong> in active stakes</span>}
        </div>
        <div className="mt-1.5 text-[11px] font-medium opacity-70">
          Points are for bragging rights, streaks & the leaderboard — they never convert to cash.
        </div>
      </div>

      {/* Action tiles */}
      <div className="mt-3 flex gap-2.5">
        <button
          onClick={() => toast.message('Perks are coming soon — points stay points for now.')}
          className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink"
        >
          <Gift className="h-[19px] w-[19px]" strokeWidth={2} />
          <span className="text-[12px] font-bold">Perks</span>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink"
        >
          <HistoryIcon className="h-[19px] w-[19px]" strokeWidth={2} />
          <span className="text-[12px] font-bold">History</span>
        </button>
      </div>

      {/* Activity */}
      <div className="wg-label mt-[22px]">ACTIVITY</div>
      <div className="mt-2.5 flex flex-col gap-[9px] pb-6">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-[13px]" />)
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No point activity yet. Win a ranked match to get on the board.
          </p>
        ) : (
          rows.map((r) => {
            const credit = r.amount > 0
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                  style={{
                    background: credit ? 'hsl(var(--you-tint))' : 'hsl(var(--glyph, var(--muted)) / .15)',
                    color: credit ? 'hsl(var(--you))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {credit ? <ArrowDownLeft className="h-[17px] w-[17px]" strokeWidth={2} /> : <ArrowUpRight className="h-[17px] w-[17px]" strokeWidth={2} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-ink">{r.description ?? r.type}</div>
                  <div className="mt-px font-mono text-[10px] font-semibold tracking-[0.04em] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className="font-display text-[15px] font-extrabold tabular-nums"
                  style={{ color: credit ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}
                >
                  {credit ? '+' : ''}{r.amount} PTS
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-auto pb-4 text-center">
        <Trophy className="mx-auto h-4 w-4 text-muted-foreground" strokeWidth={2} />
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">Season resets keep the ladder fresh.</p>
      </div>
    </div>
  )
}
