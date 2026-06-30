-- Asymmetric stakes: each player can stake a different amount.
-- wager_amount_cents is redefined as the TOTAL POT (creator + opponent stakes).
-- creator_stake_cents / opponent_stake_cents track each player's contribution.
--
-- Free-form category replaces the rigid sport enum in the UI (sport col kept
-- for backward compat and DB-level filtering; UI uses category text instead).

-- 1. Add per-player stake columns (nullable so backfill can run first).
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS creator_stake_cents  INTEGER,
  ADD COLUMN IF NOT EXISTS opponent_stake_cents INTEGER;

-- 2. Add free-form category label (e.g. "Golf", "World Series", "Pushups").
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Backfill: existing rows had wager_amount_cents = "each player's stake",
--    so total pot = 2x. Stake columns get the original per-player amount.
UPDATE public.wagers
SET
  creator_stake_cents  = wager_amount_cents,
  opponent_stake_cents = wager_amount_cents,
  wager_amount_cents   = wager_amount_cents * 2,
  category             = COALESCE(custom_sport_label, sport::TEXT)
WHERE creator_stake_cents IS NULL;

-- 4. Apply NOT NULL constraints now that backfill is done.
ALTER TABLE public.wagers
  ALTER COLUMN creator_stake_cents  SET NOT NULL,
  ALTER COLUMN creator_stake_cents  SET DEFAULT 0,
  ALTER COLUMN opponent_stake_cents SET DEFAULT 0;
