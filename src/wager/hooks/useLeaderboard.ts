import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface LeaderboardRow {
  user_id: string
  display_name: string
  username: string
  wins: number
  losses: number
  win_rate: number
  net_cents: number
  is_me: boolean
}

export function useLeaderboard(metric: 'net' | 'rate', enabled = true) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    supabase.rpc('get_leaderboard', { metric }).then(({ data }) => {
      if (cancelled) return
      setRows((data as LeaderboardRow[]) ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [metric, enabled])

  return { rows, loading }
}
