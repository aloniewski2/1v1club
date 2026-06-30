import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function ConnectReturn() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!loading && profile?.stripe_account_ready) {
      setReady(true)
      const timer = setTimeout(() => navigate('/'), 3000)
      return () => clearTimeout(timer)
    }
  }, [profile, loading, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        {ready ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
            <h1 className="text-2xl font-bold">Payouts enabled!</h1>
            <p className="text-muted-foreground">You're all set to receive winnings. Redirecting…</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Confirming your payout setup…</p>
            <p className="text-xs text-muted-foreground">This may take a moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
