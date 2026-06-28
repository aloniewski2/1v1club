import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WagerEvent } from '../lib/wagerTypes'

export function useWagerEvents(wagerId: string | undefined) {
  const [events, setEvents] = useState<WagerEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wagerId) return

    async function fetchEvents() {
      const { data } = await supabase
        .from('wager_events')
        .select('*')
        .eq('wager_id', wagerId)
        .order('created_at', { ascending: true })
      setEvents((data as WagerEvent[]) ?? [])
      setLoading(false)
    }

    fetchEvents()

    const channel = supabase
      .channel(`wager-events-${wagerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wager_events', filter: `wager_id=eq.${wagerId}` },
        (payload) => { setEvents((prev) => [...prev, payload.new as WagerEvent]) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [wagerId])

  return { events, loading }
}
