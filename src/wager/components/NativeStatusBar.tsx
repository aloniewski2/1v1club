import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Keeps the native status bar's icon color in sync with the light/dark theme. */
export default function NativeStatusBar() {
  const { theme } = useTheme()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    StatusBar.setStyle({ style: theme === 'light' ? Style.Dark : Style.Light }).catch(() => {})
  }, [theme])

  return null
}
