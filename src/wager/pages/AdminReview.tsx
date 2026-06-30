import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatPot, formatCents, calcPayout } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Wager, DisputeSubmission, ProofAsset } from '../lib/wagerTypes'

interface Case {
  wager: Wager
  submissions: DisputeSubmission[]
  proofs: ProofAsset[]
}

export default function AdminReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!user) return
    const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!me?.is_admin) { setIsAdmin(false); setLoading(false); return }
    setIsAdmin(true)

    const { data: wagers } = await supabase
      .from('wagers')
      .select('*, creator_profile:profiles!created_by(*), opponent_profile:profiles!opponent_id(*)')
      .eq('status', 'disputed')
      .order('updated_at', { ascending: true })

    const built: Case[] = []
    for (const w of (wagers ?? []) as Wager[]) {
      const { data: subs } = await supabase.from('dispute_submissions').select('*').eq('wager_id', w.id)
      const { data: proofs } = await supabase.from('proof_assets').select('*').eq('wager_id', w.id)
      built.push({ wager: w, submissions: (subs as DisputeSubmission[]) ?? [], proofs: (proofs as ProofAsset[]) ?? [] })
    }
    setCases(built)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function openProof(path: string) {
    const { data } = await supabase.storage.from('wager-proofs').createSignedUrl(path, 600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else toast.error('Could not open file')
  }

  async function resolve(wagerId: string, winnerId: string) {
    setResolving(wagerId)
    const { error } = await supabase.functions.invoke('admin-resolve-dispute', {
      body: { wager_id: wagerId, winner_id: winnerId, resolution_note: notes[wagerId]?.trim() || undefined },
    })
    setResolving(null)
    if (error) return toast.error('Resolve failed: ' + error.message)
    toast.success('Dispute resolved and paid out.')
    setCases((prev) => prev.filter((c) => c.wager.id !== wagerId))
  }

  if (loading) return <Skeleton className="mt-10 h-64 w-full rounded-[18px]" />
  if (isAdmin === false) {
    return (
      <div className="flex min-h-[calc(100vh-2rem)] flex-col">
        <ScreenHeader label="ADMIN" onBack={() => navigate('/')} />
        <div className="mt-16 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Admins only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="DISPUTE REVIEW" onBack={() => navigate('/')} />
      <h1 className="mt-4 font-display text-[26px] font-extrabold text-ink">Open disputes</h1>
      <p className="mt-1 text-[13px] font-medium text-muted-foreground">{cases.length} awaiting a decision.</p>

      {cases.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">Nothing to review. 🎉</div>
      )}

      <div className="mt-5 flex flex-col gap-4 pb-6">
        {cases.map(({ wager, submissions, proofs }) => {
          const parties = [
            { id: wager.created_by, p: wager.creator_profile },
            { id: wager.opponent_id, p: wager.opponent_profile },
          ]
          return (
            <div key={wager.id} className="rounded-[16px] border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">{wager.category || wager.custom_sport_label || wager.sport}</span>
                <span className="font-display text-sm font-extrabold text-ink">{formatPot(wager.wager_amount_cents)} pot</span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">{wager.description}</p>

              {/* Each party's case */}
              <div className="mt-3 flex flex-col gap-3">
                {parties.map(({ id, p }) => {
                  const sub = submissions.find((s) => s.user_id === id)
                  const myProofs = proofs.filter((pr) => pr.user_id === id)
                  const claimsSelf = sub?.claimed_winner_id === id
                  return (
                    <div key={id ?? 'none'} className="rounded-[12px] border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-ink">{p?.display_name ?? 'Player'}</span>
                        <span className={cn('font-mono text-[10px] font-bold', sub ? 'text-you' : 'text-muted-foreground')}>
                          {sub ? (claimsSelf ? 'CLAIMS THE WIN' : 'CONCEDES') : 'NO SUBMISSION'}
                        </span>
                      </div>
                      {sub && <p className="mt-1.5 text-[12px] leading-snug text-ink/85">"{sub.statement}"</p>}
                      {myProofs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {myProofs.map((pr) => (
                            <button
                              key={pr.id}
                              onClick={() => openProof(pr.storage_path)}
                              className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold',
                                pr.duplicate_of ? 'border-amber-500/40 text-amber-600' : 'border-border text-muted-foreground')}
                            >
                              {pr.duplicate_of ? <AlertTriangle className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                              {pr.duplicate_of ? 'reused proof' : 'view proof'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <textarea
                value={notes[wager.id] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [wager.id]: e.target.value }))}
                rows={2}
                placeholder="Resolution note (shown to both players)…"
                className="mt-3 w-full resize-none rounded-[11px] border border-border bg-background px-3 py-2 text-[12px] text-ink outline-none placeholder:text-muted-foreground"
              />

              <div className="mt-2.5 flex gap-2">
                {parties.map(({ id, p }) => (
                  <button
                    key={id ?? 'x'}
                    disabled={!id || resolving === wager.id}
                    onClick={() => id && resolve(wager.id, id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-you bg-you-tint px-3 py-2.5 text-[12px] font-bold text-you disabled:opacity-50"
                  >
                    {resolving === wager.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {p?.display_name ?? 'Player'} wins
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Winner receives {formatCents(calcPayout(wager.wager_amount_cents))}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
