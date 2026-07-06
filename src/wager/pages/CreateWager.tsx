import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Check, Link as LinkIcon, Trophy, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Mode = 'ranked' | 'casual'

const FREE_ACTIVE_LIMIT = 3

export default function CreateWager() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [category, setCategory] = useState('')
  const [mode, setMode] = useState<Mode>('ranked')
  const [stake, setStake] = useState(25)
  const [description, setDescription] = useState('')
  const [editingBet, setEditingBet] = useState(false)
  const [matchDate, setMatchDate] = useState('')
  const [loading, setLoading] = useState(false)

  const balance = profile?.points ?? 0
  const canSubmit = description.trim().length > 0 && (mode === 'casual' || stake <= balance)

  async function handleSubmit() {
    if (!user || !canSubmit) {
      if (!description.trim()) toast.error('Describe the challenge first.')
      else if (mode === 'ranked' && stake > balance) toast.error(`You only have ${balance} pts to stake.`)
      return
    }
    // Free-tier cap on simultaneously-open challenges; Pro is unlimited.
    if (!profile?.is_pro) {
      const { count } = await supabase
        .from('wagers')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('status', ['awaiting_opponent', 'active', 'declaring'])
      if ((count ?? 0) >= FREE_ACTIVE_LIMIT) {
        toast.error(`Free plan allows ${FREE_ACTIVE_LIMIT} open challenges. Go Pro for unlimited.`)
        navigate('/pro')
        return
      }
    }
    setLoading(true)
    const slug = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-CH`
    const { data: wager, error } = await supabase
      .from('wagers')
      .insert({
        slug,
        created_by: user.id,
        sport: 'other',
        custom_sport_label: category.trim() || null,
        category: category.trim() || null,
        description: description.trim(),
        match_date: matchDate || null,
        mode,
        stake_points: mode === 'ranked' ? stake : 0,
        // Free-to-play: no money. Cash columns stay at 0.
        wager_amount_cents: 0,
        creator_stake_cents: 0,
        opponent_stake_cents: 0,
        status: 'awaiting_opponent',
      })
      .select()
      .single()
    setLoading(false)
    if (error) toast.error('Failed to create challenge: ' + error.message)
    else navigate(`/${wager.id}/invite`)
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="NEW CHALLENGE" onBack={() => navigate('/')} />

      <h1 className="mt-4 font-display text-[28px] font-extrabold text-ink">Throw down.</h1>

      {/* The challenge */}
      <div className="wg-label mt-5">THE CHALLENGE</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        {editingBet ? (
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setEditingBet(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingBet(false)}
            placeholder="e.g. First to 11, winner takes bragging rights."
            className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <button onClick={() => setEditingBet(true)} className="flex flex-1 items-center justify-between gap-2.5 text-left">
            <span className={cn('text-sm font-medium', description ? 'text-ink' : 'text-muted-foreground')}>
              {description || 'Tap to write the challenge…'}
            </span>
            <Pencil className="h-[15px] w-[15px] shrink-0 text-muted-foreground" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Category */}
      <div className="wg-label mt-[22px]">CATEGORY · OPTIONAL</div>
      <Input
        className="mt-2.5"
        placeholder="e.g. Basketball, NBA 2K, Chess…"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        maxLength={40}
      />

      {/* Mode */}
      <div className="wg-label mt-[22px]">MODE</div>
      <div className="mt-2.5 flex gap-2.5">
        <button
          onClick={() => setMode('ranked')}
          className={cn('flex flex-1 items-center gap-2.5 rounded-[13px] border p-3 text-left transition-all',
            mode === 'ranked' ? 'border-[1.5px] border-you bg-you-tint' : 'border-border bg-surface')}
        >
          <Trophy className={cn('h-[18px] w-[18px]', mode === 'ranked' ? 'text-you' : 'text-muted-foreground')} strokeWidth={2} />
          <div>
            <div className="text-[13px] font-bold text-ink">Ranked</div>
            <div className="text-[11px] font-medium text-muted-foreground">Stake points on it</div>
          </div>
          {mode === 'ranked' && <Check className="ml-auto h-4 w-4 text-you" strokeWidth={2.5} />}
        </button>
        <button
          onClick={() => setMode('casual')}
          className={cn('flex flex-1 items-center gap-2.5 rounded-[13px] border p-3 text-left transition-all',
            mode === 'casual' ? 'border-[1.5px] border-you bg-you-tint' : 'border-border bg-surface')}
        >
          <Smile className={cn('h-[18px] w-[18px]', mode === 'casual' ? 'text-you' : 'text-muted-foreground')} strokeWidth={2} />
          <div>
            <div className="text-[13px] font-bold text-ink">Casual</div>
            <div className="text-[11px] font-medium text-muted-foreground">Just for fun</div>
          </div>
          {mode === 'casual' && <Check className="ml-auto h-4 w-4 text-you" strokeWidth={2.5} />}
        </button>
      </div>

      {/* Stake (ranked only) */}
      {mode === 'ranked' && (
        <>
          <div className="wg-label mt-[22px]">POINTS STAKED — EACH PLAYER</div>
          <div className="mt-2.5 flex gap-2">
            {[10, 25, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => setStake(n)}
                disabled={n > balance}
                className={cn(
                  'flex-1 rounded-[12px] border py-3 text-center text-sm font-bold transition-all disabled:opacity-40',
                  stake === n ? 'border-[1.5px] border-you bg-you-tint text-you' : 'border-border bg-surface text-ink',
                )}
              >
                {n} <span className="font-mono text-[9px]">PTS</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-surface px-[18px] py-4">
            <div>
              <div className="wg-label tracking-[0.14em]">TOTAL STAKE</div>
              <div className="mt-0.5 font-display text-[30px] font-extrabold leading-none text-ink">{stake * 2} <span className="text-[14px]">PTS</span></div>
            </div>
            <div className="text-right">
              <div className="wg-label tracking-[0.1em]">WINNER GETS</div>
              <div className="mt-0.5 font-display text-[22px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>{stake * 2} PTS</div>
              <div className="mt-px text-[10px] font-medium text-muted-foreground">no fee · you have {balance}</div>
            </div>
          </div>
        </>
      )}

      {/* Date */}
      <div className="wg-label mt-[22px]">DATE · OPTIONAL</div>
      <Input className="mt-2.5" type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />

      {/* Opponent */}
      <div className="wg-label mt-[22px]">OPPONENT</div>
      <div className="mt-2.5 flex items-center gap-3 rounded-[13px] border-[1.5px] border-you bg-you-tint px-3.5 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-you text-white">
          <LinkIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink">Invite by link</div>
          <div className="mt-px text-[11px] font-medium text-muted-foreground">Anyone with the link can accept</div>
        </div>
        <Check className="h-[18px] w-[18px] text-you" strokeWidth={2.5} />
      </div>

      <div className="mt-5 pb-4">
        <PrimaryCTA onClick={handleSubmit} disabled={loading || !canSubmit}>
          {loading ? 'Creating…' : 'Create & get invite link'}
        </PrimaryCTA>
      </div>
    </div>
  )
}
