import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, Lock, Calendar, MapPin, Trophy, ImageIcon, MessageCircle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useWager } from '../hooks/useWager'
import { useWagerEvents } from '../hooks/useWagerEvents'
import { SPORT_CONFIG, STATUS_CONFIG, PLATFORM_FEE_PCT } from '../lib/wagerConstants'
import { formatCents, formatPot, calcPayout, calcPlatformFee, initialsOf } from '../lib/wagerUtils'
import StatusBadge from '../components/StatusBadge'
import InviteSharePanel from '../components/InviteSharePanel'
import WagerTimeline from '../components/WagerTimeline'
import MatchupBar from '../components/MatchupBar'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Wager } from '../lib/wagerTypes'

export default function WagerDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { wager, loading } = useWager(id)
  const { events } = useWagerEvents(id)
  const navigate = useNavigate()
  const [proofUrls, setProofUrls] = useState<{ creator?: string; opponent?: string }>({})

  useEffect(() => {
    if (searchParams.get('paid') === 'true') {
      toast.success('Payment submitted! Waiting for Stripe confirmation…')
    }
  }, [searchParams])

  useEffect(() => {
    if (!wager) return
    const { creator_proof_path, opponent_proof_path } = wager
    if (!creator_proof_path && !opponent_proof_path) return
    async function fetchSignedUrls() {
      const next: { creator?: string; opponent?: string } = {}
      if (creator_proof_path) {
        const { data } = await supabase.storage.from('wager-proofs').createSignedUrl(creator_proof_path, 3600)
        if (data?.signedUrl) next.creator = data.signedUrl
      }
      if (opponent_proof_path) {
        const { data } = await supabase.storage.from('wager-proofs').createSignedUrl(opponent_proof_path, 3600)
        if (data?.signedUrl) next.opponent = data.signedUrl
      }
      setProofUrls(next)
    }
    fetchSignedUrls()
  }, [wager?.creator_proof_path, wager?.opponent_proof_path])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-[18px]" />
        <Skeleton className="h-40 w-full rounded-[18px]" />
      </div>
    )
  }

  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const sport = SPORT_CONFIG[wager.sport]
  const statusConfig = STATUS_CONFIG[wager.status]
  const isCreator = wager.created_by === user?.id
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile
  const isCompleted = wager.status === 'completed'
  const iWon = isCompleted && wager.confirmed_winner_id === user?.id

  const myPaid = isCreator ? wager.creator_paid_at : wager.opponent_paid_at
  const theirPaid = isCreator ? wager.opponent_paid_at : wager.creator_paid_at
  const rivalPending = !them

  const stakeStr = formatCents(wager.wager_amount_cents)

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader
        label={sport.label.toUpperCase()}
        onBack={() => navigate('/wager')}
        right={<StatusBadge status={wager.status} />}
      />

      <h1 className="mt-[18px] max-w-[300px] font-display text-[28px] font-extrabold leading-[1.1] text-ink">
        {wager.description}
      </h1>

      <div className="mt-[18px]">
        <MatchupBar
          height={112}
          seam={30}
          pot={formatPot(wager.wager_amount_cents)}
          you={{ name: 'You', initial: initialsOf(me?.display_name, 1), sub: myPaid ? `PAID ${stakeStr}` : 'NOT PAID' }}
          rival={{
            name: them?.display_name ?? 'Pending',
            initial: rivalPending ? '?' : initialsOf(them?.display_name, 1),
            sub: rivalPending ? 'NOT JOINED' : theirPaid ? `PAID ${stakeStr}` : 'NOT PAID',
          }}
          rivalPending={rivalPending}
        />
      </div>

      {/* Win / complete celebration */}
      <AnimatePresence>
        {iWon && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-3.5 rounded-[18px] border border-you bg-you-tint p-4 text-center"
          >
            <Trophy className="mx-auto mb-1.5 h-8 w-8 text-you" />
            <p className="font-display text-lg font-extrabold text-ink">You won.</p>
            <p className="text-sm text-muted-foreground">
              {formatCents(calcPayout(wager.wager_amount_cents))} sent to your payout account
            </p>
          </motion.div>
        )}
        {isCompleted && !iWon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3.5 rounded-[18px] border border-border bg-surface p-4 text-center">
            <p className="font-display font-extrabold text-ink">Challenge complete</p>
            <p className="text-sm text-muted-foreground">
              {them?.display_name ?? 'Your opponent'} won {formatCents(calcPayout(wager.wager_amount_cents))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escrow card */}
      <div className="mt-3.5 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex flex-col gap-[9px] text-[13px] font-medium text-muted-foreground">
          <Row label="Your stake" value={`${stakeStr} ${myPaid ? '✓' : ''}`} />
          <Row label={`${them?.display_name ?? 'Opponent'}'s stake`} value={rivalPending ? '—' : `${stakeStr} ${theirPaid ? '✓' : ''}`} />
          <Row label={`Platform fee (${PLATFORM_FEE_PCT}%)`} value={`−${formatCents(calcPlatformFee(wager.wager_amount_cents))}`} />
          <div className="mt-0.5 flex items-center justify-between border-t border-border pt-[11px]">
            <span className="font-display text-sm font-extrabold text-ink">Winner takes</span>
            <span className="font-display text-[20px] font-extrabold tabular-nums" style={{ color: 'hsl(var(--win))' }}>
              {formatCents(calcPayout(wager.wager_amount_cents))}
            </span>
          </div>
        </div>
      </div>

      {/* Date / place chips */}
      {wager.match_date && (
        <div className="mt-3 flex gap-2">
          <Chip icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />}>
            {format(new Date(wager.match_date), 'EEE MMM d')}
          </Chip>
          <Chip icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />}>
            {sport.label}
          </Chip>
        </div>
      )}

      {/* Trash talk */}
      {them && (wager.status === 'active' || wager.status === 'declaring') && (
        <button
          onClick={() => navigate(`/wager/${wager.id}/chat`)}
          className="mt-3 flex items-center gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-3"
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-you-tint text-you">
            <MessageCircle className="h-[19px] w-[19px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[13px] font-bold text-ink">Trash talk</div>
            <div className="mt-px truncate text-[11px] font-medium text-muted-foreground">
              {them.display_name}: hope you brought your wallet 😏
            </div>
          </div>
          <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />
        </button>
      )}

      {/* Proof */}
      {(proofUrls.creator || proofUrls.opponent) && (
        <ProofSection
          creatorName={wager.creator_profile?.display_name}
          opponentName={wager.opponent_profile?.display_name}
          creatorUrl={proofUrls.creator}
          opponentUrl={proofUrls.opponent}
        />
      )}

      {/* CTA / action area */}
      <div className="mt-auto pb-2 pt-4">
        <ActionPanel wager={wager} isCreator={isCreator} navigate={navigate} />
        <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">{statusConfig.description}</p>
      </div>

      {events.length > 0 && (
        <div className="mt-2 rounded-[18px] border border-border bg-surface p-[18px]">
          <WagerTimeline events={events} />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  )
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-surface px-[11px] py-2 text-[11px] font-semibold text-ink/85">
      {icon}
      {children}
    </span>
  )
}

function ProofSection({ creatorName, opponentName, creatorUrl, opponentUrl }: {
  creatorName?: string; opponentName?: string; creatorUrl?: string; opponentUrl?: string
}) {
  return (
    <div className="mt-3 rounded-[18px] border border-border bg-surface p-[18px]">
      <div className="wg-label mb-2.5 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5" /> PROOF
      </div>
      <div className={`grid gap-3 ${creatorUrl && opponentUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {creatorUrl && <ProofImg name={creatorName ?? 'Creator'} url={creatorUrl} />}
        {opponentUrl && <ProofImg name={opponentName ?? 'Opponent'} url={opponentUrl} />}
      </div>
    </div>
  )
}

function ProofImg({ name, url }: { name: string; url: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{name}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90">
        <img src={url} alt={`${name}'s proof`} className="max-h-48 w-full object-cover" />
      </a>
    </div>
  )
}

function ActionPanel({ wager, isCreator, navigate }: {
  wager: Wager; isCreator: boolean; navigate: ReturnType<typeof useNavigate>
}) {
  const { status } = wager

  if ((status === 'pending_payment' && isCreator) || (status === 'opponent_joined' && !isCreator)) {
    return <PrimaryCTA onClick={() => navigate(`/wager/${wager.id}/pay`)}>Pay to activate</PrimaryCTA>
  }

  if (status === 'awaiting_opponent' && isCreator) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-await [animation:wgpulse_1.6s_ease-in-out_infinite]" />
          <p className="text-sm font-medium text-muted-foreground">Waiting for your opponent to accept…</p>
        </div>
        <InviteSharePanel inviteToken={wager.invite_token} />
        <PrimaryCTA onClick={() => navigate(`/wager/${wager.id}/invite`)}>Open invite screen</PrimaryCTA>
      </div>
    )
  }

  if (status === 'active') {
    return (
      <>
        <PrimaryCTA onClick={() => navigate(`/wager/${wager.id}/declare`)}>Declare the winner</PrimaryCTA>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Lock className="h-3 w-3" style={{ color: 'hsl(var(--win))' }} strokeWidth={2} />
          Funds held securely until both confirm
        </div>
      </>
    )
  }

  if (status === 'declaring') {
    const myDeclaration = isCreator ? wager.declared_winner_by_creator : wager.declared_winner_by_opponent
    return myDeclaration ? (
      <div className="flex items-center gap-2 rounded-[14px] border border-border bg-surface p-4" style={{ color: 'hsl(var(--amber))' }}>
        <Clock className="h-4 w-4" />
        <p className="text-sm font-medium">Waiting for your opponent to declare</p>
      </div>
    ) : (
      <PrimaryCTA onClick={() => navigate(`/wager/${wager.id}/declare`)}>Confirm the result</PrimaryCTA>
    )
  }

  if (status === 'disputed') {
    return (
      <div className="space-y-3 rounded-[14px] border p-4" style={{ borderColor: 'hsl(var(--rival))', background: 'hsl(var(--rival-tint))' }}>
        <div className="flex items-center gap-2" style={{ color: 'hsl(var(--rival))' }}>
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Results don't match — under review</p>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">
          You both claimed the win. The pot is frozen until a mod resolves it (within 48 hours).
        </p>
        <PrimaryCTA onClick={() => navigate(`/wager/${wager.id}/dispute`)}>Open review</PrimaryCTA>
      </div>
    )
  }

  return null
}
