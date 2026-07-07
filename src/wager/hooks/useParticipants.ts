import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WagerParticipant } from '../lib/wagerTypes'

export function useParticipants(wagerId: string | undefined, enabled = true) {
  const [participants, setParticipants] = useState<WagerParticipant[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!wagerId) return
    const { data } = await supabase
      .from('wager_participants')
      .select('*, profile:profiles!user_id(*)')
      .eq('wager_id', wagerId)
      .order('created_at', { ascending: true })
    setParticipants((data as WagerParticipant[]) ?? [])
    setLoading(false)
  }, [wagerId])

  useEffect(() => {
    if (!wagerId || !enabled) { setLoading(false); return }
    refetch()
    const ch = supabase
      .channel(`participants-${wagerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wager_participants', filter: `wager_id=eq.${wagerId}` }, refetch)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [wagerId, enabled, refetch])

  return { participants, loading, refetch }
}
