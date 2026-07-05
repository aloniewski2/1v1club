import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface ChatMessage {
  id: string
  sender_id: string
  body: string
  created_at: string
}

export function useWagerChat(wagerId: string | undefined) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!wagerId) return

    let cancelled = false

    async function fetchHistory() {
      const { data } = await supabase
        .from('wager_messages')
        .select('id, sender_id, body, created_at')
        .eq('wager_id', wagerId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (!cancelled) {
        setMessages(data ?? [])
        setLoading(false)
      }
    }

    fetchHistory()

    const channel = supabase
      .channel(`wager_messages:${wagerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wager_messages',
          filter: `wager_id=eq.${wagerId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages((prev) => {
            // skip if we already have it (optimistic insert)
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [wagerId])

  async function sendMessage(body: string) {
    if (!wagerId || !user || !body.trim()) return
    const trimmed = body.trim().slice(0, 500)

    // optimistic insert so the UI feels instant
    const optimistic: ChatMessage = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      body: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('wager_messages')
      .insert({ wager_id: wagerId, sender_id: user.id, body: trimmed })
      .select('id, sender_id, body, created_at')
      .single()

    if (error) {
      // roll back optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      console.error('chat send failed', error)
      return
    }

    // swap optimistic id for real id
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? (data as ChatMessage) : m)),
    )
  }

  return { messages, loading, sendMessage }
}
