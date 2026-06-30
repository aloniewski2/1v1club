import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, Check, BarChart3, Infinity as InfinityIcon, Shield, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ScreenHeader from '../components/ScreenHeader'
import PrimaryCTA from '../components/PrimaryCTA'
import { Skeleton } from '@/components/ui/skeleton'

const PERKS = [
  { icon: BarChart3, title: 'Detailed stats', sub: 'Full match history & head-to-head records' },
  { icon: InfinityIcon, title: 'Unlimited challenges', sub: 'No weekly cap on active challenges' },
  { icon: Sparkles, title: 'Ranked seasons', sub: 'Seasonal leaderboards & badges' },
  { icon: Shield, title: 'Priority dispute review', sub: 'Your disputes go to the front of the queue' },
]

export default function WagerPro() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const isPro = Boolean(profile?.is_pro)

  // Handle return from Stripe Checkout.
  useEffect(() => {
    const status = params.get('status')
    if (!status || !user) return
    if (status === 'success') {
      setSyncing(true)
      supabase.functions.invoke('sync-subscription').then(({ data }) => {
        setSyncing(false)
        params.delete('status')
        setParams(params, { replace: true })
        if (data?.is_pro) {
          toast.success("You're 1v1 Club Pro! 👑")
          setTimeout(() => window.location.reload(), 600)
        } else {
          toast.message('Subscription is processing — refresh in a moment.')
        }
      })
    } else if (status === 'cancelled') {
      params.delete('status')
      setParams(params, { replace: true })
      toast.message('Checkout cancelled.')
    }
  }, [params, user])

  async function upgrade() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
      body: { origin: window.location.origin },
    })
    setBusy(false)
    if (error || !data?.url) return toast.error(error?.message ?? 'Could not start checkout')
    window.location.href = data.url
  }

  async function manage() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: { origin: window.location.origin },
    })
    setBusy(false)
    if (error || !data?.url) return toast.error(error?.message ?? 'Could not open billing portal')
    window.location.href = data.url
  }

  if (loading || syncing) return <Skeleton className="mt-10 h-80 w-full rounded-[18px]" />

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <ScreenHeader label="1V1 CLUB PRO" onBack={() => navigate('/profile')} />

      <div className="mt-5 text-center">
        <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-[18px] bg-you-tint">
          <Crown className="h-8 w-8 text-you" strokeWidth={2} />
        </div>
        <h1 className="mt-3.5 font-display text-[28px] font-extrabold text-ink">
          {isPro ? "You're Pro." : 'Go Pro.'}
        </h1>
        <p className="mx-auto mt-1 max-w-[280px] text-[13px] font-medium text-muted-foreground">
          {isPro
            ? `Membership ${profile?.subscription_status ?? 'active'}${profile?.pro_until ? ` · renews ${new Date(profile.pro_until).toLocaleDateString()}` : ''}.`
            : 'Level up your game with stats, ranked seasons, and more.'}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {PERKS.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-you-tint text-you">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">{title}</div>
              <div className="text-[11px] font-medium text-muted-foreground">{sub}</div>
            </div>
            {isPro && <Check className="h-4 w-4 text-you" strokeWidth={2.5} />}
          </div>
        ))}
      </div>

      <div className="mt-auto pb-2 pt-6">
        {isPro ? (
          <button
            onClick={manage}
            disabled={busy}
            className="w-full rounded-[14px] border border-border bg-surface px-4 py-3.5 font-display text-[14px] font-extrabold text-ink disabled:opacity-60"
          >
            {busy ? 'Opening…' : 'Manage subscription'}
          </button>
        ) : (
          <>
            <PrimaryCTA onClick={upgrade} disabled={busy}>
              {busy ? 'Starting checkout…' : 'Upgrade — $4.99/mo'}
            </PrimaryCTA>
            <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">
              Cancel anytime. Billed monthly via Stripe.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
