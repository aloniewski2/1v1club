import { z } from 'zod'
import { MIN_WAGER_DOLLARS, MAX_WAGER_DOLLARS } from '../lib/wagerConstants'

export const SPORT_VALUES = [
  'golf', 'basketball', 'tennis', 'pickleball', 'chess',
  'gaming', 'ping_pong', 'pool', 'bowling', 'darts', 'other',
] as const

export const createWagerSchema = z.object({
  sport: z.enum(SPORT_VALUES, { required_error: 'Select a sport or game' }),
  custom_sport_label: z.string().max(40).optional(),
  description: z
    .string()
    .min(5, 'Add a brief description (at least 5 characters)')
    .max(280, 'Description too long (max 280 characters)'),
  match_date: z.string().optional(),
  wager_amount_dollars: z
    .number({ invalid_type_error: 'Enter a wager amount' })
    .min(MIN_WAGER_DOLLARS, `Minimum wager is $${MIN_WAGER_DOLLARS}`)
    .max(MAX_WAGER_DOLLARS, `Maximum wager is $${MAX_WAGER_DOLLARS.toLocaleString()}`),
})

export type CreateWagerFormData = z.infer<typeof createWagerSchema>
