import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export function useFriends(userId: string | undefined) {
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    setFriendships((data as Friendship[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    refresh()
    const channel = supabase
      .channel(`friendships-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, refresh])

  /** Map of the OTHER user's id -> friendship, for quick per-row state. */
  const byOther = new Map<string, Friendship>()
  for (const f of friendships) {
    const other = f.requester_id === userId ? f.addressee_id : f.requester_id
    byOther.set(other, f)
  }

  const incoming = friendships.filter((f) => f.status === 'pending' && f.addressee_id === userId)
  const accepted = friendships.filter((f) => f.status === 'accepted')

  async function sendRequest(addresseeId: string, displayName?: string) {
    if (!userId) return
    const { error } = await supabase.from('friendships').insert({ requester_id: userId, addressee_id: addresseeId })
    if (error) throw error
    // Best-effort notification to the addressee.
    await supabase.from('notifications').insert({
      user_id: addresseeId,
      type: 'friend_request',
      title: 'New friend request',
      body: `${displayName ?? 'Someone'} wants to be your friend on 1v1 Club.`,
    })
  }

  async function respond(friendshipId: string, accept: boolean) {
    await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'blocked', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
  }

  return { friendships, byOther, incoming, accepted, loading, sendRequest, respond, refresh }
}
