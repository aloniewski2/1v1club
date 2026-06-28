import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Wager } from '../lib/wagerTypes'

export function useWager(id: string | undefined) {
  const [wager, setWager] = useState<Wager | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchWager() {
      const { data, error: err } = await supabase
        .from('wagers')
        .select('*, creator_profile:profiles!created_by(*), opponent_profile:profiles!opponent_id(*)')
        .eq('id', id)
        .single()

      if (err) {
        setError(err.message)
      } else {
        setWager(data as Wager)
      }
      setLoading(false)
    }

    fetchWager()

    const channel = supabase
      .channel(`wager-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wagers', filter: `id=eq.${id}` },
        (payload) => {
          setWager((prev) => prev ? { ...prev, ...payload.new } as Wager : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  return { wager, loading, error }
}
