import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ConnectRefresh() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    const returnUrl = `${window.location.origin}/wager/connect/return`
    const refreshUrl = `${window.location.origin}/wager/connect/refresh`

    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { return_url: returnUrl, refresh_url: refreshUrl },
    })

    setLoading(false)

    if (error || !data?.url) {
      toast.error('Failed to refresh link. Try again.')
    } else {
      window.location.href = data.url
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Setup link expired</h1>
        <p className="text-muted-foreground text-sm">
          Your Stripe onboarding link has expired. Generate a new one to continue setting up payouts.
        </p>
        <Button onClick={handleRefresh} disabled={loading} className="w-full">
          {loading ? 'Loading…' : 'Get new setup link'}
        </Button>
      </div>
    </div>
  )
}
