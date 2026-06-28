import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, X, Image as ImageIcon, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useWager } from '../hooks/useWager'
import { useAuth } from '../hooks/useAuth'
import { formatPot } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

const MAX_BYTES = 10 * 1024 * 1024

export default function WagerEvidence() {
  const { id } = useParams<{ id: string }>()
  const { wager, loading } = useWager(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [note, setNote] = useState('')
  const [uploaded, setUploaded] = useState<{ name: string; size: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) return toast.error('File must be under 10 MB')
    if (!wager || !user) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${wager.id}/dispute-${user.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('wager-proofs').upload(path, file, { contentType: file.type, upsert: false })
    setUploading(false)
    if (error) return toast.error('Upload failed: ' + error.message)
    setUploaded({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` })
  }

  if (loading) return <Skeleton className="mt-10 h-64 w-full rounded-[18px]" />
  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="ADD EVIDENCE" onBack={() => navigate(`/wager/${id}/dispute`)} />

      <h1 className="mt-4 font-display text-[28px] font-extrabold text-ink">Show your proof.</h1>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        A scorecard, photo, or witness helps a mod settle the {formatPot(wager.wager_amount_cents)} pot fast.
      </p>

      <div className="wg-label mt-[22px]">UPLOADS</div>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-2.5 flex w-full flex-col items-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed border-border bg-surface px-4 py-6"
      >
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-you-tint text-you">
          <Plus className="h-[22px] w-[22px]" strokeWidth={2} />
        </span>
        <span className="text-center">
          <span className="block text-[13px] font-bold text-ink">{uploading ? 'Uploading…' : 'Add photo or file'}</span>
          <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">Tap to attach · JPG, PNG, PDF</span>
        </span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {uploaded && (
        <div className="mt-3 flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-you-tint text-you">
            <ImageIcon className="h-[19px] w-[19px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">{uploaded.name}</div>
            <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-[0.04em]" style={{ color: 'hsl(var(--win))' }}>{uploaded.size} · UPLOADED ✓</div>
          </div>
          <button onClick={() => setUploaded(null)} className="text-lg font-semibold text-muted-foreground">×</button>
        </div>
      )}

      <div className="wg-label mt-[22px]">NOTE TO REVIEWER <span className="opacity-50">· OPTIONAL</span></div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Final card shows me at +2, they conceded on the 9th green."
        className="mt-2.5 w-full resize-none rounded-[13px] border border-border bg-surface px-3.5 py-3 text-[13px] font-medium leading-[1.45] text-ink outline-none placeholder:text-muted-foreground"
      />

      <div className="mt-auto pb-2 pt-6">
        <PrimaryCTA disabled={!uploaded} onClick={() => { toast.success('Evidence submitted to the reviewer.'); navigate(`/wager/${id}/dispute`) }}>
          {uploaded ? 'Submit to reviewer' : 'Attach evidence first'}
        </PrimaryCTA>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Lock className="h-3 w-3" style={{ color: 'hsl(var(--win))' }} strokeWidth={2} />
          Evidence is shared only with the reviewer
        </div>
      </div>
    </div>
  )
}
