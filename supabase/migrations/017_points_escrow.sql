-- Points escrow: stakes are locked when a ranked match goes live and released
-- on settlement, so a player can never over-commit across concurrent matches or
-- go negative. Spendable = points - points_escrowed. All escrow math is
-- server-side (SECURITY DEFINER, service-role only); the lock/release fire from
-- triggers so the client can't bypass them.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_escrowed INTEGER NOT NULL DEFAULT 0;

-- Atomically lock `amt` points if spendable allows; raises otherwise.
CREATE OR REPLACE FUNCTION public.lock_stake(p_user UUID, p_amt INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_amt IS NULL OR p_amt <= 0 THEN RETURN; END IF;
  UPDATE public.profiles
     SET points_escrowed = points_escrowed + p_amt, updated_at = NOW()
   WHERE id = p_user AND (points - points_escrowed) >= p_amt;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough points to stake % (check your available balance)', p_amt;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_stake(p_user UUID, p_amt INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_amt IS NULL OR p_amt <= 0 THEN RETURN; END IF;
  UPDATE public.profiles
     SET points_escrowed = GREATEST(0, points_escrowed - p_amt), updated_at = NOW()
   WHERE id = p_user;
END;
$$;

-- settle_match now releases both escrows before moving points (zero-sum).
-- Because each side's stake was locked (spendable >= stake at lock time), the
-- loser's points can never drop below zero.
CREATE OR REPLACE FUNCTION public.settle_match(
  p_winner UUID, p_loser UUID, p_stake INTEGER, p_wager UUID DEFAULT NULL, p_label TEXT DEFAULT 'match'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_stake > 0 THEN
    PERFORM release_stake(p_winner, p_stake);
    PERFORM release_stake(p_loser,  p_stake);
  END IF;
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

REVOKE EXECUTE ON FUNCTION public.lock_stake(uuid, integer)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_stake(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.lock_stake(uuid, integer)    TO service_role;
GRANT  EXECUTE ON FUNCTION public.release_stake(uuid, integer) TO service_role;

-- Lock the creator's stake when a ranked match is created.
CREATE OR REPLACE FUNCTION public.escrow_on_create()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.mode = 'ranked' AND NEW.stake_points > 0 AND NEW.status = 'awaiting_opponent' THEN
    PERFORM lock_stake(NEW.created_by, NEW.stake_points);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS escrow_on_create_trg ON public.wagers;
CREATE TRIGGER escrow_on_create_trg
  AFTER INSERT ON public.wagers
  FOR EACH ROW EXECUTE FUNCTION public.escrow_on_create();

-- Lock the opponent's stake when they accept (awaiting_opponent -> active);
-- release both stakes if a match is cancelled/refunded/voided pre-settlement.
CREATE OR REPLACE FUNCTION public.escrow_on_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.mode <> 'ranked' OR NEW.stake_points <= 0 THEN RETURN NEW; END IF;

  -- Opponent joins.
  IF OLD.status = 'awaiting_opponent' AND NEW.status = 'active' AND NEW.opponent_id IS NOT NULL THEN
    PERFORM lock_stake(NEW.opponent_id, NEW.stake_points);
  END IF;

  -- Match ends without a winner: give the stakes back.
  IF NEW.status IN ('cancelled','refunded') AND OLD.status NOT IN ('cancelled','refunded','completed') THEN
    PERFORM release_stake(NEW.created_by, NEW.stake_points);
    IF NEW.opponent_id IS NOT NULL AND OLD.status <> 'awaiting_opponent' THEN
      PERFORM release_stake(NEW.opponent_id, NEW.stake_points);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS escrow_on_transition_trg ON public.wagers;
CREATE TRIGGER escrow_on_transition_trg
  AFTER UPDATE ON public.wagers
  FOR EACH ROW EXECUTE FUNCTION public.escrow_on_transition();
