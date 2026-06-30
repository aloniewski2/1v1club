import type { WagerStatus } from './wagerTypes'
import { PLATFORM_FEE_PCT } from './wagerConstants'

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

// wager_amount_cents is now the TOTAL POT (creator_stake + opponent_stake).
export function formatPot(potCents: number): string {
  return formatCents(potCents)
}

export function calcPlatformFee(potCents: number): number {
  return Math.round(potCents * (PLATFORM_FEE_PCT / 100))
}

export function calcPayout(potCents: number): number {
  return potCents - calcPlatformFee(potCents)
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
  return `${window.location.origin}/join/${inviteToken}`
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

/** Sum of total pots, in cents. */
export function sumPot(wagers: { wager_amount_cents: number }[]): number {
  return wagers.reduce((acc, w) => acc + w.wager_amount_cents, 0)
}
