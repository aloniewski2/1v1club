import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WagerDispute, DisputeSubmission } from '../lib/wagerTypes'

export function useDispute(wagerId: string | undefined) {
  const [dispute, setDispute] = useState<WagerDispute | null>(null)
  const [submissions, setSubmissions] = useState<DisputeSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!wagerId) return
    const { data: d } = await supabase
      .from('wager_disputes')
      .select('*')
      .eq('wager_id', wagerId)
      .maybeSingle()
    setDispute((d as WagerDispute) ?? null)

    if (d) {
      const { data: subs } = await supabase
        .from('dispute_submissions')
        .select('*')
        .eq('dispute_id', (d as WagerDispute).id)
        .order('submitted_at', { ascending: true })
      setSubmissions((subs as DisputeSubmission[]) ?? [])
    } else {
      setSubmissions([])
    }
    setLoading(false)
  }, [wagerId])

  useEffect(() => {
    if (!wagerId) return
    refetch()

    const channel = supabase
      .channel(`dispute-${wagerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wager_disputes', filter: `wager_id=eq.${wagerId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_submissions', filter: `wager_id=eq.${wagerId}` }, refetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [wagerId, refetch])

  return { dispute, submissions, loading, refetch }
}
