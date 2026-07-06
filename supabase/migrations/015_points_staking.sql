-- Points staking (design handoff v2): players stake season points on a match;
-- winner takes the pot. Zero-sum, no fee, points are NEVER redeemable for
-- real-world value (deliberate legal choice — see docs/compliance/).

ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS stake_points INTEGER NOT NULL DEFAULT 25;

-- Seed balances: new users start with 500 pts; existing users topped up.
ALTER TABLE public.profiles ALTER COLUMN points SET DEFAULT 500;
UPDATE public.profiles SET points = points + 500 WHERE points < 500;

-- Activity ledger for the Points Hub.
CREATE TABLE public.points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wager_id    UUID REFERENCES public.wagers(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,          -- won | lost | bonus | adjust
  amount      INTEGER NOT NULL,       -- signed points delta
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX points_ledger_user_idx ON public.points_ledger (user_id, created_at DESC);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_ledger_select_own" ON public.points_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- Zero-sum settlement: winner +stake, loser -stake, W/L records, ledger rows.
-- stake=0 (casual) still records W/L, moves no points.
CREATE OR REPLACE FUNCTION public.settle_match(
  p_winner UUID, p_loser UUID, p_stake INTEGER, p_wager UUID DEFAULT NULL, p_label TEXT DEFAULT 'match'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET wins = wins + 1, points = points + p_stake, updated_at = NOW()
   WHERE id = p_winner;
  UPDATE public.profiles SET losses = losses + 1, points = points - p_stake, updated_at = NOW()
   WHERE id = p_loser;
  IF p_stake > 0 THEN
    INSERT INTO public.points_ledger (user_id, wager_id, type, amount, description) VALUES
      (p_winner, p_wager, 'won',  p_stake,  'Won · ' || p_label),
      (p_loser,  p_wager, 'lost', -p_stake, 'Lost · ' || p_label);
  END IF;
END;
$$;
