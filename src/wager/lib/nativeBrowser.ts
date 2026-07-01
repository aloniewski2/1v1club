import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

/**
 * Opens a hosted external URL (Stripe Checkout, Billing Portal, Connect
 * onboarding, etc). On native, this uses an in-app browser (SFSafariViewController)
 * since redirecting the WKWebView itself away from the app is not recoverable.
 * `onClose` fires when the user dismisses the in-app browser — since it can't
 * reliably intercept Stripe's redirect back, callers should treat `onClose` as
 * "check server state now" (e.g. call sync-subscription) rather than assuming
 * success. On web this is a normal top-level redirect, so `onClose` is unused.
 */
export async function openExternalUrl(url: string, onClose?: () => void): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const listener = await Browser.addListener('browserFinished', () => {
      listener.remove()
      onClose?.()
    })
    await Browser.open({ url })
  } else {
    window.location.href = url
  }
}
