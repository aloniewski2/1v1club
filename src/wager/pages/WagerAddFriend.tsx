import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import { initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ProfileResult {
  id: string
  display_name: string
  username: string
}

export default function WagerAddFriend() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { byOther, incoming, sendRequest, respond } = useFriends(user?.id)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [searching, setSearching] = useState(false)

  // Debounced username/display-name search against profiles.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq('id', user?.id ?? '')
        .limit(10)
      setResults((data as ProfileResult[]) ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, user?.id])

  async function handleAdd(p: ProfileResult) {
    try {
      await sendRequest(p.id, profile?.display_name)
      toast.success(`Friend request sent to ${p.display_name}.`)
    } catch {
      toast.error('Could not send request (maybe already sent).')
    }
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader label="ADD FRIENDS" onBack={() => navigate('/leaderboard')} />

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <>
          <div className="wg-label mt-4">REQUESTS</div>
          <div className="mt-2.5 flex flex-col gap-[9px]">
            {incoming.map((f) => (
              <RequestRow key={f.id} requesterId={f.requester_id} onAccept={() => respond(f.id, true)} onDecline={() => respond(f.id, false)} />
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        <Search className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={2} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or @username" className="flex-1 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted-foreground" />
      </div>

      <div className="wg-label mt-[22px]">RESULTS</div>
      <div className="mt-2.5 flex flex-col gap-[9px] pb-4">
        {searching ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-[13px]" />)
        ) : query.trim().length < 2 ? (
          <p className="py-6 text-center text-[13px] font-medium text-muted-foreground">Type a name to find friends.</p>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-[13px] font-medium text-muted-foreground">No one found for “{query.trim()}”.</p>
        ) : (
          results.map((p) => {
            const existing = byOther.get(p.id)
            const requested = existing?.status === 'pending'
            const friends = existing?.status === 'accepted'
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--you))' }}>{initialsOf(p.display_name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{p.display_name}</div>
                  <div className="mt-px text-[11px] font-medium text-muted-foreground">@{p.username}</div>
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={requested || friends}
                  className={cn('shrink-0 rounded-[9px] px-3.5 py-2 text-[12px] font-bold', requested || friends ? 'cursor-default border border-border bg-surface text-muted-foreground' : 'text-[hsl(var(--cta-ink))]')}
                  style={requested || friends ? undefined : { background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}
                >
                  {friends ? 'Friends' : requested ? 'Requested' : 'Add'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function RequestRow({ requesterId, onAccept, onDecline }: { requesterId: string; onAccept: () => void; onDecline: () => void }) {
  const [p, setP] = useState<ProfileResult | null>(null)
  useEffect(() => {
    supabase.from('profiles').select('id, display_name, username').eq('id', requesterId).single().then(({ data }) => setP(data as ProfileResult))
  }, [requesterId])
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-you bg-you-tint px-[13px] py-[11px]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--you))' }}>{initialsOf(p?.display_name)}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-ink">{p?.display_name ?? '…'}</div>
        <div className="mt-px text-[11px] font-medium text-muted-foreground">wants to be friends</div>
      </div>
      <button onClick={onAccept} className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))' }} aria-label="Accept">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button onClick={onDecline} className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-surface text-muted-foreground" aria-label="Decline">
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
