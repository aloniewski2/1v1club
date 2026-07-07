import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Crown, Check, Play, Flag, AlertTriangle, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useParticipants } from '../hooks/useParticipants'
import { initialsOf } from '../lib/wagerUtils'
import InviteSharePanel from './InviteSharePanel'
import ScreenHeader from './ScreenHeader'
import StatusBadge from './StatusBadge'
import PrimaryCTA from './PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Wager, WagerParticipant } from '../lib/wagerTypes'

export default function MultiplayerMatch({ wager }: { wager: Wager }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { participants, loading } = useParticipants(wager.id)
  const [pick, setPick] = useState<{ user?: string; team?: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const isHost = wager.created_by === user?.id
  const me = participants.find((p) => p.user_id === user?.id)
  const ranked = wager.mode !== 'casual'
  const stake = ranked ? (wager.stake_points ?? 25) : 0
  const potTotal = stake * (wager.max_players ?? participants.length)
  const teams = wager.format === 'teams'
  const label = wager.category || wager.custom_sport_label || 'Match'

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('multiplayer-result', {
      body: { wager_id: wager.id, action, ...extra },
    })
    setBusy(false)
    if (error) return toast.error(error.message)
    return data
  }

  async function start() { if (await act('start')) toast.success('Match is live!') }
  async function declare() {
    if (teams && pick?.team == null) return toast.error('Pick the winning team')
    if (!teams && !pick?.user) return toast.error('Pick a winner')
    if (await act('declare', { winner_user: pick?.user ?? null, winner_team: pick?.team ?? null }))
      toast.success('Declared — waiting on the others to confirm.')
  }
  async function confirm() { if (await act('confirm')) toast.success('Confirmed.') }
  async function dispute() { if (await act('dispute')) toast.message('Sent to review.') }

  if (loading) return <Skeleton className="mt-10 h-[60vh] w-full rounded-[18px]" />

  const confirmedCount = participants.filter((p) => p.result_confirmed).length
  const winnerLabel = () => {
    if (teams) return wager.confirmed_winner_team ?? wager.declared_winner_team
      ? `Team ${wager.confirmed_winner_team ?? wager.declared_winner_team}` : ''
    const w = participants.find((p) => p.user_id === (wager.confirmed_winner_id ?? wager.declared_winner_user))
    return w?.profile?.display_name ?? 'Winner'
  }

  const roster = (teamNo: number | null) =>
    participants.filter((p) => p.team_no === teamNo)

  function ParticipantRow({ p, selectable }: { p: WagerParticipant; selectable?: boolean }) {
    const selected = pick?.user === p.user_id
    const isWinner = wager.status === 'completed' &&
      (teams ? p.team_no === wager.confirmed_winner_team : p.user_id === wager.confirmed_winner_id)
    return (
      <button
        disabled={!selectable}
        onClick={() => selectable && setPick({ user: p.user_id })}
        className={cn('flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-all',
          selected ? 'border-[1.5px] border-you bg-you-tint' : 'border-border bg-surface',
          !selectable && 'cursor-default')}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: p.user_id === user?.id ? 'hsl(var(--you))' : 'hsl(var(--rival))' }}>
          {initialsOf(p.profile?.display_name, 1)}
        </span>
        <span className="flex-1 truncate text-[13px] font-bold text-ink">
          {p.user_id === user?.id ? 'You' : p.profile?.display_name ?? 'Player'}
        </span>
        {p.is_host && <Crown className="h-3.5 w-3.5 text-you" strokeWidth={2.5} fill="currentColor" />}
        {wager.status === 'declaring' && (p.result_confirmed
          ? <Check className="h-4 w-4 text-you" strokeWidth={2.5} />
          : <span className="font-mono text-[9px] font-bold text-muted-foreground">WAITING</span>)}
        {isWinner && <span className="font-mono text-[9px] font-bold text-you">WON</span>}
        {selected && <Check className="h-4 w-4 text-you" strokeWidth={2.5} />}
      </button>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label={label.toUpperCase()} onBack={() => navigate('/')} right={<StatusBadge status={wager.status} />} />

      <h1 className="mt-[18px] max-w-[300px] font-display text-[26px] font-extrabold leading-[1.1] text-ink">{wager.description}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold tracking-[0.06em] text-muted-foreground">
        <span>{wager.format === 'ffa' ? `FREE-FOR-ALL · ${wager.max_players}P` : `TEAMS · ${(wager.max_players ?? 4) / 2}V${(wager.max_players ?? 4) / 2}`}</span>
        <span>·</span>
        <span style={{ color: ranked ? 'hsl(var(--win))' : undefined }}>{ranked ? `${potTotal} PT POT` : 'CASUAL'}</span>
      </div>
      {wager.rules && (
        <div className="mt-2.5 rounded-[12px] border border-border bg-surface px-3.5 py-2.5 text-[12px] font-medium text-ink/85">
          <span className="font-bold">Rules:</span> {wager.rules}
        </div>
      )}

      {/* Roster */}
      <div className="wg-label mt-[22px]">
        ROSTER · {participants.length}/{wager.max_players}
        {wager.status === 'declaring' && ` · ${confirmedCount}/${participants.length} confirmed`}
      </div>
      {teams ? (
        <div className="mt-2.5 flex gap-2.5">
          {[1, 2].map((t) => (
            <button key={t} disabled={!(isHost && wager.status !== 'awaiting_opponent' && wager.status !== 'completed')}
              onClick={() => isHost && setPick({ team: t })}
              className={cn('flex-1 rounded-[14px] border p-2.5 text-left transition-all',
                pick?.team === t ? 'border-[1.5px] border-you bg-you-tint' : 'border-border bg-surface')}>
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-muted-foreground">TEAM {t}</span>
                {(wager.confirmed_winner_team === t) && <span className="font-mono text-[9px] font-bold text-you">WON</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                {roster(t).map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: p.user_id === user?.id ? 'hsl(var(--you))' : 'hsl(var(--rival))' }}>
                      {initialsOf(p.profile?.display_name, 1)}
                    </span>
                    <span className="truncate text-[12px] font-semibold text-ink">{p.user_id === user?.id ? 'You' : p.profile?.display_name}</span>
                    {p.is_host && <Crown className="h-3 w-3 text-you" strokeWidth={2.5} fill="currentColor" />}
                  </div>
                ))}
                {roster(t).length === 0 && <span className="px-1 text-[11px] text-muted-foreground">Open slot…</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-[7px]">
          {participants.map((p) => (
            <ParticipantRow key={p.id} p={p}
              selectable={isHost && (wager.status === 'active' || wager.status === 'declaring')} />
          ))}
        </div>
      )}

      {/* Trash talk */}
      {wager.status !== 'awaiting_opponent' && (
        <button onClick={() => navigate(`/${wager.id}/chat`)}
          className="mt-3 flex items-center gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-you-tint text-you">
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div className="flex-1 text-left"><div className="text-[13px] font-bold text-ink">Group chat</div>
            <div className="text-[11px] font-medium text-muted-foreground">Talk trash with the table</div></div>
        </button>
      )}

      {/* Actions */}
      <div className="mt-auto pb-2 pt-5">
        {wager.status === 'awaiting_opponent' && (
          isHost ? (
            <div className="space-y-3">
              <InviteSharePanel inviteToken={wager.invite_token} />
              <PrimaryCTA onClick={start} disabled={busy || participants.length < 2}>
                <Play className="h-4 w-4" strokeWidth={2.5} />
                {participants.length < 2 ? 'Waiting for players…' : `Start match (${participants.length})`}
              </PrimaryCTA>
            </div>
          ) : (
            <p className="py-2 text-center text-[13px] font-medium text-muted-foreground">
              You're in. Waiting for the host to start.
            </p>
          )
        )}

        {wager.status === 'active' && (
          isHost ? (
            <PrimaryCTA onClick={declare} disabled={busy || (teams ? pick?.team == null : !pick?.user)}>
              <Flag className="h-4 w-4" strokeWidth={2.5} /> Declare {teams ? 'winning team' : 'the winner'}
            </PrimaryCTA>
          ) : (
            <p className="py-2 text-center text-[13px] font-medium text-muted-foreground">
              Match is live. The host declares the result when it's done.
            </p>
          )
        )}

        {wager.status === 'declaring' && (
          <div className="space-y-3">
            <div className="rounded-[14px] border border-border bg-surface px-4 py-3 text-center text-[13px] font-medium text-ink">
              Host declared <strong>{winnerLabel()}</strong> the winner.
            </div>
            {me && !me.result_confirmed && !isHost ? (
              <>
                <PrimaryCTA onClick={confirm} disabled={busy}>Confirm result</PrimaryCTA>
                <button onClick={dispute} disabled={busy} className="w-full text-center text-[12px] font-semibold" style={{ color: 'hsl(var(--rival))' }}>
                  I disagree — dispute
                </button>
              </>
            ) : (
              <p className="text-center text-[12px] font-medium text-muted-foreground">
                Waiting on {participants.length - confirmedCount} player(s) to confirm.
              </p>
            )}
          </div>
        )}

        {wager.status === 'completed' && (
          <div className="rounded-[16px] border border-you bg-you-tint p-4 text-center">
            <Crown className="mx-auto mb-1 h-7 w-7 text-you" fill="currentColor" />
            <p className="font-display text-lg font-extrabold text-ink">{winnerLabel()} won</p>
            {ranked && <p className="text-sm text-muted-foreground">{potTotal} pts settled to the winner{teams ? 's' : ''}.</p>}
          </div>
        )}

        {wager.status === 'disputed' && (
          <div className="flex items-center gap-2 rounded-[14px] border p-4" style={{ borderColor: 'hsl(var(--rival))', background: 'hsl(var(--rival-tint))' }}>
            <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--rival))' }} />
            <p className="text-sm font-medium text-ink">Result disputed — a mod will review it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
