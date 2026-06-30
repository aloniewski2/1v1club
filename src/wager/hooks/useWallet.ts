import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type LedgerType =
  | 'winnings'
  | 'platform_fee'
  | 'stake_hold'
  | 'stake_release'
  | 'refund'
  | 'cashout'
  | 'cashout_fee'
  | 'deposit'

export interface LedgerEntry {
  id: string
  user_id: string
  wager_id: string | null
  type: LedgerType
  amount_cents: number
  status: 'pending' | 'settled' | 'failed'
  stripe_ref: string | null
  description: string | null
  created_at: string
}

interface Balance {
  available_cents: number
  escrow_cents: number
}

export function useWallet(userId: string | undefined) {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [balance, setBalance] = useState<Balance>({ available_cents: 0, escrow_cents: 0 })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) return
    const [{ data: ledger }, { data: bal }] = await Promise.all([
      supabase
        .from('ledger_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.rpc('get_wallet_balance'),
    ])
    setEntries((ledger as LedgerEntry[]) ?? [])
    // RPC returns a single-row table.
    const row = Array.isArray(bal) ? bal[0] : bal
    if (row) setBalance({ available_cents: Number(row.available_cents) || 0, escrow_cents: Number(row.escrow_cents) || 0 })
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    refresh()

    const channel = supabase
      .channel(`ledger-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ledger_entries', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, refresh])

  return { entries, balance, loading, refresh }
}
