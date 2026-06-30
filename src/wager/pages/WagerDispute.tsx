import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, FileText, Shield, Check, Clock } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { useDispute } from '../hooks/useDispute'
import { useAuth } from '../hooks/useAuth'
import { formatPot, initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'closed'
  const h = Math.floor(ms / 3_600_000)
  if (h >= 24) return `${Math.floor(h / 24)}d left`
  if (h >= 1) return `${h}h left`
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`
}

export default function WagerDispute() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { dispute, submissions, loading: dLoading } = useDispute(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (loading || dLoading) return <Skeleton className="mt-10 h-64 w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile

  const mySubmission = submissions.find((s) => s.user_id === user?.id)
  const theirSubmission = submissions.find((s) => s.user_id !== user?.id)
  const resolved = dispute?.status === 'resolved'

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label={resolved ? 'RESOLVED' : 'UNDER REVIEW'} onBack={() => navigate(`/${id}`)} />

      <div className="mt-[22px] text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-[16px]" style={{ background: 'hsl(var(--amber-bg) / 0.16)' }}>
          <AlertTriangle className="h-[30px] w-[30px]" style={{ color: 'hsl(var(--amber))' }} strokeWidth={2} />
        </div>
        <h1 className="mt-3.5 font-display text-[26px] font-extrabold text-ink">
          {resolved ? 'Dispute resolved' : "Results don't match"}
        </h1>
        <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] font-medium text-muted-foreground">
          {resolved
            ? `A reviewer settled the ${formatPot(wager.wager_amount_cents)} pot.`
            : `You both claimed the win. The pot is frozen until both sides submit evidence and a reviewer decides.`}
        </p>
        {dispute && !resolved && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" /> Evidence window: {timeLeft(dispute.evidence_deadline)}
          </div>
        )}
      </div>

      {/* Submission status for each side */}
      <div className="mt-[22px] flex gap-2.5">
        <SubmissionCard side="you" name="You" initial={initialsOf(me?.display_name, 1)} submitted={Boolean(mySubmission)} />
        <SubmissionCard side="rival" name={them?.display_name ?? 'They'} initial={initialsOf(them?.display_name, 1)} submitted={Boolean(theirSubmission)} />
      </div>

      {resolved ? (
        <div className="mt-[22px] rounded-[14px] border border-border bg-surface p-4">
          <div className="wg-label">REVIEWER DECISION</div>
          <p className="mt-1.5 text-[13px] font-semibold text-ink">
            Winner: {dispute?.resolution_winner_id === (isCreator ? wager.created_by : wager.opponent_id) ? 'You' : (them?.display_name ?? 'Opponent')}
          </p>
          {dispute?.resolution_note && <p className="mt-1 text-[12px] text-muted-foreground">{dispute.resolution_note}</p>}
        </div>
      ) : (
        <>
          <div className="wg-label mt-[22px]">HOW IT'S SETTLED</div>
          <div className="mt-2.5 flex flex-col gap-[9px]">
            <InfoRow icon={<FileText className="h-[17px] w-[17px]" strokeWidth={2} />} title="Both sides submit evidence" sub="Statement + proof, locked once sent" />
            <InfoRow icon={<Shield className="h-[17px] w-[17px]" strokeWidth={2} />} title="A reviewer decides" sub="Pot releases to the rightful winner" />
          </div>

          <div className="mt-auto pb-2 pt-6">
            {mySubmission ? (
              <div className="rounded-[13px] border border-border bg-surface px-4 py-3.5 text-center text-[13px] font-medium text-muted-foreground">
                <Check className="mr-1.5 inline h-4 w-4 text-you" strokeWidth={2.5} />
                Your case is locked in. Waiting on {theirSubmission ? 'the reviewer' : `${them?.display_name ?? 'your opponent'}`}.
              </div>
            ) : (
              <PrimaryCTA onClick={() => navigate(`/${id}/evidence`)}>Submit my case</PrimaryCTA>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SubmissionCard({ side, name, initial, submitted }: { side: 'you' | 'rival'; name: string; initial: string; submitted: boolean }) {
  const color = side === 'you' ? 'var(--you)' : 'var(--rival)'
  const tint = side === 'you' ? 'var(--you-tint)' : 'var(--rival-tint)'
  return (
    <div className="flex-1 rounded-[14px] border p-3.5 text-center" style={{ borderColor: submitted ? `hsl(${color})` : 'hsl(var(--border))', background: submitted ? `hsl(${tint})` : 'hsl(var(--surface))' }}>
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ background: `hsl(${color})` }}>{initial}</span>
      <div className="mt-2 text-[12px] font-bold text-ink">{name}</div>
      <div className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.06em]" style={{ color: submitted ? `hsl(${color})` : 'hsl(var(--muted-foreground))' }}>
        {submitted ? 'SUBMITTED ✓' : 'WAITING'}
      </div>
    </div>
  )
}

function InfoRow({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-glyph text-ink">{icon}</span>
      <div className="flex-1">
        <div className="text-[13px] font-bold text-ink">{title}</div>
        <div className="mt-px text-[11px] font-medium text-muted-foreground">{sub}</div>
      </div>
    </div>
  )
}
