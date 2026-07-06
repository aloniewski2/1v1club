import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Minus, Plus, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useWager } from '../hooks/useWager'
import { initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

interface Score { creator_score: number; opponent_score: number }

/**
 * Real-time shared scoreboard: both players update from their own device and
 * see the other's taps instantly (Supabase realtime). Purely informational —
 * the official result is still the both-confirm declare flow.
 */
export default function LiveScore() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState<Score>({ creator_score: 0, opponent_score: 0 })
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('live_scores').select('creator_score, opponent_score').eq('wager_id', id).maybeSingle()
    if (data) setScore(data as Score)
    setReady(true)
  }, [id])

  useEffect(() => {
    if (!id) return
    load()
    const ch = supabase
      .channel(`score-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_scores', filter: `wager_id=eq.${id}` }, (p) => {
        if (p.new) setScore(p.new as Score)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, load])

  if (loading || !ready) return <Skeleton className="mt-10 h-80 w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile
  const myScore = isCreator ? score.creator_score : score.opponent_score
  const theirScore = isCreator ? score.opponent_score : score.creator_score
  const myField = isCreator ? 'creator_score' : 'opponent_score'

  async function bump(delta: number) {
    const next = Math.max(0, myScore + delta)
    setScore((s) => ({ ...s, [myField]: next }))

    // Write ONLY our own column so simultaneous updates from both players don't
    // clobber each other (last-write-wins on a full-row upsert loses updates).
    const patch = { [myField]: next, updated_by: user!.id, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('live_scores').update(patch).eq('wager_id', wager!.id)
    // First bump on a match with no row yet: create it, then re-apply our column.
    if (error) {
      await supabase.from('live_scores').insert({ wager_id: wager!.id, ...patch })
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="LIVE SCORE" onBack={() => navigate(`/${id}`)} />

      <p className="mt-3 text-center font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground">
        SYNCED LIVE · BOTH PLAYERS CAN UPDATE
      </p>

      {/* Scoreboard */}
      <div className="mt-4 flex gap-3">
        {/* You */}
        <div className="flex-1 rounded-[18px] border-[1.5px] border-you bg-you-tint p-4 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ background: 'hsl(var(--you))' }}>
            {initialsOf(me?.display_name, 1)}
          </span>
          <div className="mt-1.5 text-[12px] font-bold text-ink">You</div>
          <div className="font-display text-[56px] font-extrabold leading-none text-ink tabular-nums">{myScore}</div>
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={() => bump(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink">
              <Minus className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button onClick={() => bump(1)} className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: 'hsl(var(--you))' }}>
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {/* Them */}
        <div className="flex-1 rounded-[18px] border border-border bg-surface p-4 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ background: 'hsl(var(--rival))' }}>
            {initialsOf(them?.display_name, 1)}
          </span>
          <div className="mt-1.5 truncate text-[12px] font-bold text-ink">{them?.display_name ?? 'Opponent'}</div>
          <div className="font-display text-[56px] font-extrabold leading-none tabular-nums" style={{ color: 'hsl(var(--rival))' }}>{theirScore}</div>
          <p className="mt-5 text-[10px] font-medium text-muted-foreground">They update their own side</p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] font-medium text-muted-foreground">
        The scoreboard is just for the match — the official result is still confirmed by both players.
      </p>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA onClick={() => navigate(`/${id}/declare`)}>
          <Flag className="h-4 w-4" strokeWidth={2.5} />
          Match over — declare the winner
        </PrimaryCTA>
      </div>
    </div>
  )
}
