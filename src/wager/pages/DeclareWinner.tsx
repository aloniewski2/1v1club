import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useWager } from '../hooks/useWager'
import { formatCents, formatPot, calcPayout, initialsOf } from '../lib/wagerUtils'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Profile } from '../lib/wagerTypes'

const MAX_PROOF_BYTES = 10 * 1024 * 1024

function PlayerCard({ profile, side, selected, onClick }: {
  profile: Profile; side: 'you' | 'rival'; selected: boolean; onClick: () => void
}) {
  const color = side === 'you' ? 'var(--you)' : 'var(--rival)'
  const tint = side === 'you' ? 'var(--you-tint)' : 'var(--rival-tint)'
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn('flex flex-1 flex-col items-center gap-2.5 rounded-[18px] border p-[22px] transition-all')}
      style={{
        borderColor: selected ? `hsl(${color})` : 'hsl(var(--border))',
        borderWidth: selected ? 2 : 1,
        background: selected ? `hsl(${tint})` : 'hsl(var(--surface))',
      }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-bold text-white"
        style={{ background: `hsl(${color})` }}
      >
        {initialsOf(profile.display_name, 1)}
      </span>
      <span className="text-[15px] font-bold text-ink">{profile.display_name}</span>
      <span className="font-mono text-[9px] font-bold tracking-[0.08em]" style={{ color: `hsl(${color})` }}>
        {selected ? 'WINNER ✓' : 'TAP TO PICK'}
      </span>
    </motion.button>
  )
}

export default function DeclareWinner() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { wager, loading } = useWager(id)
  const navigate = useNavigate()

  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_PROOF_BYTES) return toast.error('Image must be under 10 MB')
    if (!file.type.startsWith('image/')) return toast.error('Only image files are accepted')
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }, [])

  function clearProof() {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(null)
    setProofPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadProof(): Promise<string | null> {
    if (!proofFile || !wager || !user) return null
    const ext = proofFile.name.split('.').pop() ?? 'jpg'
    const path = `${wager.id}/${user.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('wager-proofs').upload(path, proofFile, { contentType: proofFile.type, upsert: false })
    if (error) throw new Error('Proof upload failed: ' + error.message)
    // Fingerprint the image server-side; warn (but don't block) on reuse.
    const { data: reg } = await supabase.functions.invoke('register-proof', {
      body: { wager_id: wager.id, storage_path: path, context: 'declaration' },
    })
    if (reg?.duplicate) toast.warning('Note: this proof image was already used on another wager.')
    return path
  }

  async function handleConfirm() {
    if (!selected || !wager) return
    setSubmitting(true)
    let proofPath: string | null = null
    try {
      proofPath = await uploadProof()
    } catch (err) {
      toast.error((err as Error).message)
      setSubmitting(false)
      return
    }
    const { data, error } = await supabase.functions.invoke('declare-winner', {
      body: { wager_id: wager.id, declared_winner_id: selected, score: score.trim() || null, proof_path: proofPath },
    })
    setSubmitting(false)
    setConfirmOpen(false)
    if (error) {
      toast.error('Failed to declare winner: ' + error.message)
    } else if (data?.status === 'completed') {
      navigate(`/${id}/payout`)
    } else if (data?.status === 'disputed') {
      toast.error("Results don't match — opening review.")
      navigate(`/${id}/dispute`)
    } else {
      toast.success('Declaration submitted. Waiting for your opponent.')
      navigate(`/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-[18px]" />
      </div>
    )
  }

  if (!wager) return <p className="py-12 text-center text-muted-foreground">Challenge not found.</p>
  if (!wager.creator_profile || !wager.opponent_profile) {
    return <p className="py-12 text-center text-muted-foreground">Players not loaded.</p>
  }

  const isCreator = wager.created_by === user?.id
  const youProfile = isCreator ? wager.creator_profile : wager.opponent_profile
  const rivalProfile = isCreator ? wager.opponent_profile : wager.creator_profile
  const youId = isCreator ? wager.created_by : wager.opponent_id!
  const rivalId = isCreator ? wager.opponent_id! : wager.created_by
  const selectedProfile = selected === youId ? youProfile : rivalProfile

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="DECLARE RESULT" onBack={() => navigate(`/${id}`)} />

      <h1 className="mt-[18px] font-display text-[30px] font-extrabold text-ink">Who won?</h1>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        Tap the winner. {rivalProfile.display_name} confirms too — if you disagree, it goes to review.
      </p>

      <div className="mt-[22px] flex gap-3">
        <PlayerCard profile={youProfile} side="you" selected={selected === youId} onClick={() => setSelected(youId)} />
        <PlayerCard profile={rivalProfile} side="rival" selected={selected === rivalId} onClick={() => setSelected(rivalId)} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[16px] border border-border bg-surface px-[18px] py-4">
        <span className="text-[13px] font-semibold text-muted-foreground">
          Winner of the {formatPot(wager.wager_amount_cents)} pot takes
        </span>
        <span className="font-display text-[22px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>
          {formatCents(calcPayout(wager.wager_amount_cents))}
        </span>
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3.5 space-y-5 rounded-[18px] border border-border bg-surface p-[18px]">
          <div className="space-y-1.5">
            <Label htmlFor="score">Final score / result <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="score" placeholder='e.g. "Shot 78", "Won 6-4 6-3"' value={score} onChange={(e) => setScore(e.target.value)} maxLength={80} />
          </div>

          <div className="space-y-1.5">
            <Label>Proof photo <span className="font-normal text-muted-foreground">(optional)</span></Label>
            {proofPreview ? (
              <div className="relative overflow-hidden rounded-[13px] border border-border">
                <img src={proofPreview} alt="Proof preview" className="max-h-56 w-full object-cover" />
                <button onClick={clearProof} className="absolute right-2 top-2 rounded-full bg-background/80 p-1 backdrop-blur-sm">
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs backdrop-blur-sm">
                  <ImageIcon className="h-3 w-3" />
                  {proofFile?.name}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-border bg-surface p-7 text-center transition-colors hover:border-you/50"
              >
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-you-tint text-you">
                  <Upload className="h-[22px] w-[22px]" strokeWidth={2} />
                </span>
                <p className="text-[13px] font-bold text-ink">Upload scorecard or screenshot</p>
                <p className="text-[11px] font-medium text-muted-foreground">PNG, JPG, HEIC · max 10 MB</p>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
          </div>
        </motion.div>
      )}

      <div className="mt-auto pb-2 pt-4">
        <PrimaryCTA disabled={!selected} onClick={() => setConfirmOpen(true)}>Confirm result</PrimaryCTA>
        <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">
          Both players must declare the same winner for the payout to release. Mismatched declarations open a review.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your declaration</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You're declaring <strong>{selectedProfile?.display_name}</strong> as the winner. They receive{' '}
                  <strong>{formatCents(calcPayout(wager.wager_amount_cents))}</strong> if your opponent agrees. This cannot be changed.
                </p>
                {score.trim() && <p className="text-sm">Score: <strong>{score.trim()}</strong></p>}
                {proofFile && <p className="text-sm">Proof: <strong>{proofFile.name}</strong> will be uploaded.</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              {submitting ? (proofFile ? 'Uploading…' : 'Submitting…') : 'Yes, confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
