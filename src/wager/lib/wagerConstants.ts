import type { SportType, WagerStatus } from './wagerTypes'

export const SPORT_CONFIG: Record<SportType, { label: string; emoji: string }> = {
  golf: { label: 'Golf', emoji: '⛳' },
  basketball: { label: 'Basketball', emoji: '🏀' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  pickleball: { label: 'Pickleball', emoji: '🏓' },
  chess: { label: 'Chess', emoji: '♟️' },
  gaming: { label: 'Gaming', emoji: '🎮' },
  ping_pong: { label: 'Ping Pong', emoji: '🏓' },
  pool: { label: 'Pool / Billiards', emoji: '🎱' },
  bowling: { label: 'Bowling', emoji: '🎳' },
  darts: { label: 'Darts', emoji: '🎯' },
  other: { label: 'Other', emoji: '🏆' },
}

export const STATUS_CONFIG: Record<WagerStatus, { label: string; color: string; description: string }> = {
  pending_payment: {
    label: 'Pending Payment',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Waiting for your payment to activate this challenge',
  },
  awaiting_opponent: {
    label: 'Awaiting Opponent',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Invite link active — waiting for opponent to accept',
  },
  opponent_joined: {
    label: 'Opponent Joined',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Opponent accepted — waiting for their payment',
  },
  active: {
    label: 'Active',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Both players paid — match in progress',
  },
  declaring: {
    label: 'Declaring Winner',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Waiting for both players to declare the winner',
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Players disagree on the winner — under review',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Winner confirmed and paid out',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    description: 'Challenge was cancelled',
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    description: 'Payments refunded to both players',
  },
}

export const MIN_WAGER_DOLLARS = 5
export const MAX_WAGER_DOLLARS = 10_000
export const PLATFORM_FEE_PCT = 5
