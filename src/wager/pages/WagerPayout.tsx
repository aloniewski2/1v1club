import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { useWager } from '../hooks/useWager'
import { useAuth } from '../hooks/useAuth'
import { formatPot, formatCents, calcPayout, initialsOf } from '../lib/wagerUtils'
import MatchupBar from '../components/MatchupBar'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

export default function WagerPayout() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-4 pt-8">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="h-24 w-full rounded-[18px]" />
      </div>
    )
  }
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  const isCreator = wager.created_by === user?.id
  const me = isCreator ? wager.creator_profile : wager.opponent_profile
  const them = isCreator ? wager.opponent_profile : wager.creator_profile
  const youWon = wager.confirmed_winner_id === user?.id
  const payout = calcPayout(wager.wager_amount_cents)

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="mt-[30px] text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full opacity-[.16]" style={{ background: 'hsl(var(--win))' }} />
          <div
            className="flex h-20 w-20 flex-col items-center justify-center rounded-full"
            style={{ background: 'hsl(var(--pot-bg))', color: 'hsl(var(--pot-ink))', boxShadow: 'var(--pot-shadow)', border: '3px solid hsl(var(--pot-border))' }}
          >
            <div className="font-display text-[22px] font-extrabold leading-none">{youWon ? `$${Math.round(payout / 100)}` : '$0'}</div>
            <div className="font-mono text-[7px] font-bold tracking-[0.14em]" style={{ color: 'hsl(var(--pot-sub))' }}>WON</div>
          </div>
        </div>
        <h1 className="mt-[18px] font-display text-[32px] font-extrabold text-ink">
          {youWon ? 'You won.' : `${them?.display_name ?? 'They'} won.`}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
          {youWon
            ? `You beat ${them?.display_name ?? 'your opponent'} · pot released instantly`
            : 'Better luck next time · the pot was released to the winner'}
        </p>
      </div>

      <div className="mt-6">
        <MatchupBar
          height={96}
          seam={28}
          pot={formatPot(wager.wager_amount_cents)}
          you={{ name: 'You', initial: initialsOf(me?.display_name, 1), sub: youWon ? `WON ${formatCents(payout)}` : 'LOST', opacity: youWon ? 1 : 0.45 }}
          rival={{ name: them?.display_name ?? 'Opponent', initial: initialsOf(them?.display_name, 1), sub: youWon ? 'LOST' : `WON ${formatCents(payout)}`, opacity: youWon ? 0.45 : 1 }}
        />
      </div>

      <div className="mt-3.5 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-glyph text-ink">
              <CreditCard className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <div className="text-[13px] font-bold text-ink">{youWon ? 'Paid to your account' : `Paid to ${them?.display_name ?? 'winner'}`}</div>
              <div className="text-[11px] font-medium text-muted-foreground">Visa •••• 4242 · instant</div>
            </div>
          </div>
          <div className="font-display text-[20px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>
            {youWon ? `+${formatCents(payout)}` : '$0.00'}
          </div>
        </div>
      </div>

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA onClick={() => navigate('/wager')}>Back to home</PrimaryCTA>
        <button onClick={() => navigate('/wager/create')} className="mt-3 w-full text-center text-[12px] font-bold" style={{ color: 'hsl(var(--win))' }}>
          Rematch →
        </button>
      </div>
    </div>
  )
}
