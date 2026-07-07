export type WagerStatus =
  | 'pending_payment'
  | 'awaiting_opponent'
  | 'opponent_joined'
  | 'active'
  | 'declaring'
  | 'disputed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type SportType =
  | 'golf'
  | 'basketball'
  | 'tennis'
  | 'pickleball'
  | 'chess'
  | 'gaming'
  | 'ping_pong'
  | 'pool'
  | 'bowling'
  | 'darts'
  | 'other'

export interface Profile {
  id: string
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  date_of_birth: string
  age_verified: boolean
  stripe_account_id: string | null
  stripe_account_ready: boolean
  is_admin?: boolean
  points?: number
  points_escrowed?: number
  wins?: number
  losses?: number
  stripe_customer_id?: string | null
  is_pro?: boolean
  subscription_status?: string | null
  pro_until?: string | null
  created_at: string
  updated_at: string
}

export interface WagerDispute {
  id: string
  wager_id: string
  opened_by: string | null
  status: 'open' | 'resolved'
  resolution_winner_id: string | null
  resolution_note: string | null
  resolved_by: string | null
  resolved_at: string | null
  evidence_deadline: string
  created_at: string
}

export interface DisputeSubmission {
  id: string
  dispute_id: string
  wager_id: string
  user_id: string
  statement: string
  evidence_paths: string[]
  claimed_winner_id: string | null
  submitted_at: string
}

export interface ProofAsset {
  id: string
  wager_id: string
  user_id: string
  storage_path: string
  sha256: string
  context: string
  duplicate_of: string | null
  byte_size: number | null
  created_at: string
}

export interface Wager {
  id: string
  slug: string
  created_by: string
  opponent_id: string | null
  sport: SportType
  custom_sport_label: string | null
  category: string | null
  description: string
  match_date: string | null
  wager_amount_cents: number
  creator_stake_cents: number
  opponent_stake_cents: number
  mode?: 'ranked' | 'casual'
  stake_points?: number
  platform_fee_pct: number
  status: WagerStatus
  invite_token: string
  invite_expires_at: string
  creator_payment_intent_id: string | null
  opponent_payment_intent_id: string | null
  creator_charge_id: string | null
  opponent_charge_id: string | null
  payout_transfer_id: string | null
  declared_winner_by_creator: string | null
  declared_winner_by_opponent: string | null
  confirmed_winner_id: string | null
  creator_score: string | null
  opponent_score: string | null
  creator_proof_path: string | null
  opponent_proof_path: string | null
  creator_paid_at: string | null
  opponent_paid_at: string | null
  declaration_deadline: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  creator_profile?: Profile
  opponent_profile?: Profile
}

export interface WagerEvent {
  id: string
  wager_id: string
  actor_id: string | null
  event_type: string
  payload: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  wager_id: string | null
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}
