import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Handles opening the app via a deep link — either the custom `onev1club://`
 * scheme (works today, no domain verification needed) or, once Associated
 * Domains + apple-app-site-association are set up, a `https://1v1club.com/...`
 * Universal Link. Both arrive through the same `appUrlOpen` event.
 */
function extractAppPath(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    if (url.protocol === 'onev1club:') {
      // onev1club://join/ABC123 -> host is parsed as "join", not app-path.
      return `/${url.hostname}${url.pathname}${url.search}`
    }
    // https://1v1club.com/join/ABC123 -> pathname is already the app route.
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export default function DeepLinkListener() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const path = extractAppPath(url)
      if (path) navigate(path)
    })

    return () => {
      listenerPromise.then((l) => l.remove())
    }
  }, [navigate])

  return null
}
