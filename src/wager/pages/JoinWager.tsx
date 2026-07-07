import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { SPORT_CONFIG, PLATFORM_FEE_PCT } from '../lib/wagerConstants'
import { formatCents, formatPot, calcPayout, isInviteExpired, initialsOf } from '../lib/wagerUtils'
import MatchupBar from '../components/MatchupBar'
import SportGlyph from '../components/SportGlyph'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'
import type { Wager } from '../lib/wagerTypes'

export default function JoinWager() {
  const { token } = useParams<{ token: string }>()
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [wager, setWager] = useState<Wager | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    supabase
      .from('wagers')
      .select('*, creator_profile:profiles!created_by(*)')
      .eq('invite_token', token)
      .single()
      .then(({ data }) => {
        setWager(data as Wager)
        setLoading(false)
      })
  }, [token])

  async function handleAccept() {
    if (!user) return navigate(`/auth?next=/join/${token}`)
    if (!wager) return
    setAccepting(true)
    if (wager.created_by === user.id) {
      toast.error("You can't join your own challenge!")
      setAccepting(false)
      return
    }
    const need = wager.mode !== 'casual' ? (wager.stake_points ?? 25) : 0
    const available = (profile?.points ?? 0) - (profile?.points_escrowed ?? 0)
    if (need > available) {
      toast.error(`You need ${need} available pts to accept — you have ${available}.`)
      setAccepting(false)
      return
    }
    const { error } = await supabase
      .from('wagers')
      .update({ opponent_id: user.id, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', wager.id)
      .eq('status', 'awaiting_opponent')
    setAccepting(false)
    if (error) toast.error('Failed to accept challenge: ' + error.message)
    else {
      toast.success("Challenge accepted! It's on.")
      navigate(`/${wager.id}`)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="mx-auto w-full max-w-[420px] space-y-4 px-5 pt-10">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-[18px]" />
        <Skeleton className="h-44 w-full rounded-[18px]" />
      </div>
    )
  }

  if (!wager) {
    return (
      <div className="pt-safe pb-safe flex min-h-screen items-center justify-center bg-background px-5">
        <div className="text-center">
          <h1 className="font-display text-xl font-extrabold text-ink">Challenge not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">This invite link may be invalid.</p>
        </div>
      </div>
    )
  }

  const expired = isInviteExpired(wager.invite_expires_at)
  const sport = SPORT_CONFIG[wager.sport]
  const alreadyJoined = wager.status !== 'awaiting_opponent'
  const creator = wager.creator_profile
  const categoryLabel = wager.category || wager.custom_sport_label || sport.label
  const ranked = wager.mode !== 'casual'
  const stake = ranked ? (wager.stake_points ?? 25) : 0

  return (
    <div className="pt-safe pb-safe mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-background px-5 pb-8 pt-4">
      <div className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">YOU'RE INVITED</div>

      <h1 className="mt-5 font-display text-[28px] font-extrabold leading-[1.1] text-ink">
        {creator?.display_name ?? 'Someone'} challenged you.
      </h1>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        Accept the wager and the match goes live for both of you.
      </p>

      <div className="mt-5">
        <MatchupBar
          height={104}
          seam={28}
          pot={ranked ? `${stake * 2} PTS` : 'CASUAL'}
          you={{ name: creator?.display_name ?? 'Creator', initial: initialsOf(creator?.display_name, 1), sub: 'CHALLENGER' }}
          rival={{ name: 'You', initial: initialsOf(user?.email, 1), sub: 'YOU' }}
        />
      </div>

      <div className="mt-3.5 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex items-center gap-2.5 text-ink">
          <SportGlyph sport={wager.sport} size={18} />
          <span className="text-[15px] font-bold">{categoryLabel}</span>
        </div>
        <div className="mt-2.5 text-sm font-medium text-ink/85">{wager.description}</div>
        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3.5 text-[13px] font-medium text-muted-foreground">
          <span className="font-display text-[13px] font-extrabold text-ink">{ranked ? 'Ranked match' : 'Casual match'}</span>
          <span className="font-display text-[17px] font-extrabold tabular-nums" style={{ color: 'hsl(var(--win))' }}>
            {ranked ? `Winner takes ${stake * 2} pts` : 'For fun'}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        {expired ? (
          <p className="py-2 text-center font-medium" style={{ color: 'hsl(var(--rival))' }}>This invite has expired.</p>
        ) : alreadyJoined ? (
          <p className="py-2 text-center text-muted-foreground">This challenge already has an opponent.</p>
        ) : (
          <>
            <PrimaryCTA onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Accepting…' : ranked ? `Accept & stake ${stake} PTS` : 'Accept challenge'}
            </PrimaryCTA>
            {!user && (
              <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">
                You'll sign in or create an account first.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
