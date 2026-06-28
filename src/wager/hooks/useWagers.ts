import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Wager } from '../lib/wagerTypes'

export function useWagers(userId: string | undefined) {
  const [wagers, setWagers] = useState<Wager[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function fetchWagers() {
      const { data } = await supabase
        .from('wagers')
        .select('*, creator_profile:profiles!created_by(*), opponent_profile:profiles!opponent_id(*)')
        .or(`created_by.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      setWagers((data as Wager[]) ?? [])
      setLoading(false)
    }

    fetchWagers()

    const channel = supabase
      .channel(`wagers-user-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wagers' },
        () => { fetchWagers() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return { wagers, loading }
}
