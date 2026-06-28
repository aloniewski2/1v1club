import { useState } from 'react'
import { ExternalLink, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ConnectOnboardingBanner() {
  const [loading, setLoading] = useState(false)

  async function handleSetupPayouts() {
    setLoading(true)
    const returnUrl = `${window.location.origin}/wager/connect/return`
    const refreshUrl = `${window.location.origin}/wager/connect/refresh`

    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { return_url: returnUrl, refresh_url: refreshUrl },
    })

    setLoading(false)

    if (error || !data?.url) {
      toast.error('Failed to start payout setup. Try again.')
    } else {
      window.location.href = data.url
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-400">Set up payouts to receive winnings</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You'll need to connect your bank account before you can receive any pot winnings.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={handleSetupPayouts} disabled={loading} className="flex-shrink-0">
        {loading ? 'Loading…' : 'Set up'}
        {!loading && <ExternalLink className="h-3 w-3 ml-1" />}
      </Button>
    </div>
  )
}
