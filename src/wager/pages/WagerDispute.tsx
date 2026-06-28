import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, FileText, Shield } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { useAuth } from '../hooks/useAuth'
import { formatPot, initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

export default function WagerDispute() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (loading) return <Skeleton className="mt-10 h-64 w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="UNDER REVIEW" onBack={() => navigate(`/wager/${id}`)} />

      <div className="mt-[22px] text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-[16px]" style={{ background: 'hsl(var(--amber-bg) / 0.16)' }}>
          <AlertTriangle className="h-[30px] w-[30px]" style={{ color: 'hsl(var(--amber))' }} strokeWidth={2} />
        </div>
        <h1 className="mt-3.5 font-display text-[26px] font-extrabold text-ink">Results don't match</h1>
        <p className="mx-auto mt-1.5 max-w-[280px] text-[13px] font-medium text-muted-foreground">
          You both claimed the win. The pot is frozen until it's sorted.
        </p>
      </div>

      <div className="mt-[22px] flex gap-2.5">
        <ClaimCard side="you" name="You said" initial={initialsOf(me?.display_name, 1)} />
        <ClaimCard side="rival" name={`${them?.display_name ?? 'They'} said`} initial={initialsOf(them?.display_name, 1)} />
      </div>

      <div className="wg-label mt-[22px]">HOW TO RESOLVE</div>
      <div className="mt-2.5 flex flex-col gap-[9px]">
        <ResolveRow icon={<FileText className="h-[17px] w-[17px]" strokeWidth={2} />} title="Add evidence" sub="Scorecard photo or witness" onClick={() => navigate(`/wager/${id}/evidence`)} />
        <ResolveRow icon={<Shield className="h-[17px] w-[17px]" strokeWidth={2} />} title="Wagerly review" sub="A mod decides within 24h" />
      </div>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA onClick={() => navigate(`/wager/${id}`)}>Submit to review</PrimaryCTA>
        <button onClick={() => navigate(`/wager/${id}/declare`)} className="mt-3 w-full text-center text-[12px] font-semibold" style={{ color: 'hsl(var(--win))' }}>
          Actually, let me re-pick
        </button>
      </div>
    </div>
  )
}

function ClaimCard({ side, name, initial }: { side: 'you' | 'rival'; name: string; initial: string }) {
  const color = side === 'you' ? 'var(--you)' : 'var(--rival)'
  const tint = side === 'you' ? 'var(--you-tint)' : 'var(--rival-tint)'
  return (
    <div className="flex-1 rounded-[14px] border p-3.5 text-center" style={{ borderColor: `hsl(${color})`, background: `hsl(${tint})` }}>
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ background: `hsl(${color})` }}>{initial}</span>
      <div className="mt-2 text-[12px] font-bold text-ink">{name}</div>
      <div className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.06em]" style={{ color: `hsl(${color})` }}>I WON</div>
    </div>
  )
}

function ResolveRow({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3 text-left disabled:cursor-default">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-glyph text-ink">{icon}</span>
      <div className="flex-1">
        <div className="text-[13px] font-bold text-ink">{title}</div>
        <div className="mt-px text-[11px] font-medium text-muted-foreground">{sub}</div>
      </div>
      {onClick && <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />}
    </button>
  )
}
