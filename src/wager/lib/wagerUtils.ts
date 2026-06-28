import type { WagerStatus } from './wagerTypes'
import { PLATFORM_FEE_PCT } from './wagerConstants'

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function formatPot(wagerAmountCents: number): string {
  return formatCents(wagerAmountCents * 2)
}

export function calcPlatformFee(wagerAmountCents: number): number {
  const pot = wagerAmountCents * 2
  return Math.round(pot * (PLATFORM_FEE_PCT / 100))
}

export function calcPayout(wagerAmountCents: number): number {
  const pot = wagerAmountCents * 2
  return pot - calcPlatformFee(wagerAmountCents)
}

export function isInviteExpired(inviteExpiresAt: string): boolean {
  return new Date(inviteExpiresAt) < new Date()
}

export function formatStatus(status: WagerStatus): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function buildInviteUrl(inviteToken: string): string {
  return `${window.location.origin}/wager/join/${inviteToken}`
}

export function dollarsToCenter(dollars: number): number {
  return Math.round(dollars * 100)
}

export function initialsOf(name: string | null | undefined, max = 2): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, max)
}

/** Sum of total pots (each wager = amount × 2), in cents. */
export function sumPot(wagers: { wager_amount_cents: number }[]): number {
  return wagers.reduce((acc, w) => acc + w.wager_amount_cents * 2, 0)
}
