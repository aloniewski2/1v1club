import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Image as ImageIcon, Lock, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useWager } from '../hooks/useWager'
import { useDispute } from '../hooks/useDispute'
import { useAuth } from '../hooks/useAuth'
import { formatPot, initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const MAX_BYTES = 10 * 1024 * 1024

interface Attachment { path: string; name: string; size: string; duplicate: boolean }

export default function WagerEvidence() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { dispute, submissions, loading: dLoading, refetch } = useDispute(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [claimedWinner, setClaimedWinner] = useState<string | null>(null)
  const [statement, setStatement] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) return toast.error('File must be under 10 MB')
    if (!wager || !user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${wager.id}/dispute-${user.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('wager-proofs').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw new Error(error.message)

      // Register server-side hash + duplicate check.
      const { data, error: regErr } = await supabase.functions.invoke('register-proof', {
        body: { wager_id: wager.id, storage_path: path, context: 'dispute' },
      })
      if (regErr) throw new Error(regErr.message)

      setAttachments((prev) => [...prev, {
        path,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        duplicate: Boolean(data?.duplicate),
      }])
      if (data?.duplicate) toast.warning('Heads up: this image was already used on another wager.')
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!wager || !claimedWinner) return
    if (statement.trim().length < 5) return toast.error('Add a short statement explaining your case')
    setSubmitting(true)
    const { error } = await supabase.functions.invoke('submit-dispute-evidence', {
      body: {
        wager_id: wager.id,
        statement: statement.trim(),
        claimed_winner_id: claimedWinner,
        evidence_paths: attachments.map((a) => a.path),
      },
    })
    setSubmitting(false)
    if (error) return toast.error('Submission failed: ' + error.message)
    toast.success('Evidence submitted and locked. A reviewer will decide.')
    await refetch()
    navigate(`/${id}/dispute`)
  }

  if (loading || dLoading) return <Skeleton className="mt-10 h-64 w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>
  if (wager.status !== 'disputed') {
    return <p className="py-12 text-center text-muted-foreground">This challenge is not in dispute.</p>
  }

  const isCreator = wager.created_by === user?.id
  const youId = isCreator ? wager.created_by : wager.opponent_id!
  const rivalId = isCreator ? wager.opponent_id! : wager.created_by
  const youProfile = isCreator ? wager.creator_profile : wager.opponent_profile
  const rivalProfile = isCreator ? wager.opponent_profile : wager.creator_profile

  const alreadySubmitted = submissions.some((s) => s.user_id === user?.id)
  const resolved = dispute?.status === 'resolved'

  if (alreadySubmitted || resolved) {
    return (
      <div className="flex min-h-[calc(100vh-2rem)] flex-col">
        <ScreenHeader label="EVIDENCE" onBack={() => navigate(`/${id}/dispute`)} />
        <div className="mt-10 flex flex-col items-center text-center">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[16px] bg-you-tint text-you">
            <Lock className="h-7 w-7" strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-[24px] font-extrabold text-ink">Your evidence is locked in</h1>
          <p className="mx-auto mt-1.5 max-w-[280px] text-[13px] font-medium text-muted-foreground">
            Submissions can't be changed once made — that keeps both sides honest. A reviewer will decide the {formatPot(wager.wager_amount_cents)} pot.
          </p>
          <PrimaryCTA className="mt-6" onClick={() => navigate(`/${id}/dispute`)}>Back to dispute</PrimaryCTA>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="SUBMIT YOUR CASE" onBack={() => navigate(`/${id}/dispute`)} />

      <h1 className="mt-4 font-display text-[28px] font-extrabold text-ink">Make your case.</h1>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        State who won, why, and attach proof. This is final once submitted — you can't edit it after.
      </p>

      <div className="wg-label mt-[22px]">WHO WON?</div>
      <div className="mt-2.5 flex gap-2.5">
        {[{ pid: youId, p: youProfile, label: 'You' }, { pid: rivalId, p: rivalProfile, label: rivalProfile?.display_name ?? 'Them' }].map(({ pid, p, label }) => {
          const sel = claimedWinner === pid
          return (
            <button
              key={pid}
              onClick={() => setClaimedWinner(pid)}
              className={cn('flex flex-1 items-center gap-2.5 rounded-[13px] border p-3 text-left transition-all',
                sel ? 'border-[1.5px] border-you bg-you-tint' : 'border-border bg-surface')}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--you))' }}>
                {initialsOf(p?.display_name, 1)}
              </span>
              <span className="text-[13px] font-bold text-ink">{label}</span>
              {sel && <Check className="ml-auto h-4 w-4 text-you" strokeWidth={2.5} />}
            </button>
          )
        })}
      </div>

      <div className="wg-label mt-[22px]">YOUR STATEMENT</div>
      <textarea
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="What happened? e.g. Final card shows me at +2, they conceded on the 9th green."
        className="mt-2.5 w-full resize-none rounded-[13px] border border-border bg-surface px-3.5 py-3 text-[13px] font-medium leading-[1.45] text-ink outline-none placeholder:text-muted-foreground"
      />

      <div className="wg-label mt-[22px]">EVIDENCE <span className="opacity-50">· PHOTO / SCREENSHOT</span></div>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-2.5 flex w-full flex-col items-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed border-border bg-surface px-4 py-6"
      >
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-you-tint text-you">
          <Plus className="h-[22px] w-[22px]" strokeWidth={2} />
        </span>
        <span className="text-center">
          <span className="block text-[13px] font-bold text-ink">{uploading ? 'Hashing & checking…' : 'Add photo'}</span>
          <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">Each image is fingerprinted to catch reuse</span>
        </span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {attachments.map((a) => (
        <div key={a.path} className="mt-3 flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-you-tint text-you">
            <ImageIcon className="h-[19px] w-[19px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">{a.name}</div>
            {a.duplicate ? (
              <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.04em]" style={{ color: 'hsl(var(--amber))' }}>
                <AlertTriangle className="h-3 w-3" /> REUSED ELSEWHERE
              </div>
            ) : (
              <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-[0.04em]" style={{ color: 'hsl(var(--win))' }}>{a.size} · VERIFIED ✓</div>
            )}
          </div>
          <button onClick={() => setAttachments((prev) => prev.filter((x) => x.path !== a.path))} className="text-lg font-semibold text-muted-foreground">×</button>
        </div>
      ))}

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA disabled={!claimedWinner || statement.trim().length < 5 || submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting…' : 'Submit & lock my case'}
        </PrimaryCTA>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Lock className="h-3 w-3" style={{ color: 'hsl(var(--win))' }} strokeWidth={2} />
          Locked once submitted · shared only with the reviewer
        </div>
      </div>
    </div>
  )
}
