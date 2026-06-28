import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Check, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { SPORT_CONFIG } from '../lib/wagerConstants'
import { dollarsToCenter } from '../lib/wagerUtils'
import SportPicker from '../components/SportPicker'
import PotDisplay from '../components/PotDisplay'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { SportType } from '../lib/wagerTypes'

const AMOUNTS = [10, 25, 50, 100]

export default function CreateWager() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sport, setSport] = useState<SportType>('golf')
  const [customSport, setCustomSport] = useState('')
  const [amount, setAmount] = useState(50)
  const [description, setDescription] = useState('')
  const [editingBet, setEditingBet] = useState(false)
  const [matchDate, setMatchDate] = useState('')
  const [loading, setLoading] = useState(false)

  const amountCents = dollarsToCenter(amount)
  const canSubmit = amount >= 5 && description.trim().length > 0 && (sport !== 'other' || customSport.trim())

  async function handleSubmit() {
    if (!user || !canSubmit) {
      if (!description.trim()) toast.error('Add the bet — what are you playing for?')
      return
    }
    setLoading(true)
    const slug = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${sport.toUpperCase().slice(0, 4)}`
    const { data: wager, error } = await supabase
      .from('wagers')
      .insert({
        slug,
        created_by: user.id,
        sport,
        custom_sport_label: sport === 'other' ? customSport : null,
        description: description.trim(),
        match_date: matchDate || null,
        wager_amount_cents: amountCents,
        status: 'pending_payment',
      })
      .select()
      .single()
    setLoading(false)
    if (error) toast.error('Failed to create challenge: ' + error.message)
    else navigate(`/wager/${wager.id}/pay`)
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="NEW CHALLENGE" onBack={() => navigate('/wager')} />

      <h1 className="mt-4 font-display text-[28px] font-extrabold text-ink">Set the stakes.</h1>

      <div className="wg-label mt-5">SPORT</div>
      <div className="mt-2.5">
        <SportPicker value={sport} onChange={setSport} />
      </div>
      {sport === 'other' && (
        <Input
          className="mt-2.5"
          placeholder="Describe the game — e.g. Foosball"
          value={customSport}
          onChange={(e) => setCustomSport(e.target.value)}
        />
      )}

      <div className="wg-label mt-[22px]">STAKE — EACH PLAYER</div>
      <div className="mt-2.5 flex gap-2">
        {AMOUNTS.map((n) => {
          const selected = amount === n
          return (
            <button
              key={n}
              onClick={() => setAmount(n)}
              className={cn(
                'flex-1 rounded-[12px] border py-3 text-center text-sm font-bold transition-all',
                selected ? 'border-[1.5px] border-you bg-you-tint text-you' : 'border-border bg-surface text-ink'
              )}
            >
              ${n}
            </button>
          )
        })}
      </div>

      <div className="mt-3.5">
        <PotDisplay wagerAmountCents={amountCents} showBreakdown />
      </div>

      <div className="wg-label mt-[22px]">THE BET</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        {editingBet ? (
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setEditingBet(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingBet(false)}
            placeholder="First to par, loser buys dinner."
            className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <button onClick={() => setEditingBet(true)} className="flex flex-1 items-center justify-between gap-2.5 text-left">
            <span className={cn('text-sm font-medium', description ? 'text-ink' : 'text-muted-foreground')}>
              {description || 'Tap to write the bet…'}
            </span>
            <Pencil className="h-[15px] w-[15px] shrink-0 text-muted-foreground" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="wg-label mt-[22px]">MATCH DATE · OPTIONAL</div>
      <Input className="mt-2.5" type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />

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
