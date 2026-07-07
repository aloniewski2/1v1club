-- Multiplayer + custom games.
--
-- 1v1 matches keep the existing created_by/opponent_id path untouched (format
-- '1v1'). Free-for-all and team matches use the new wager_participants roster
-- as the source of truth, host-declares/all-confirm resolution, and a zero-sum
-- multiplayer settlement. Custom rules text applies to every format.

ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS format               TEXT NOT NULL DEFAULT '1v1',  -- '1v1' | 'ffa' | 'teams'
  ADD COLUMN IF NOT EXISTS team_count           INT,            -- teams only (2..)
  ADD COLUMN IF NOT EXISTS max_players          INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS rules                TEXT,           -- custom win condition / rules
  ADD COLUMN IF NOT EXISTS declared_winner_user UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS declared_winner_team INT,
  ADD COLUMN IF NOT EXISTS confirmed_winner_team INT;

-- Roster for multiplayer matches (host + everyone who joined).
CREATE TABLE public.wager_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id         UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_no          INT,                       -- NULL for FFA; 1..team_count for teams
  is_host          BOOLEAN NOT NULL DEFAULT FALSE,
  result_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wager_id, user_id)
);
CREATE INDEX wager_participants_wager_idx ON public.wager_participants (wager_id);

ALTER TABLE public.wager_participants ENABLE ROW LEVEL SECURITY;

-- A participant can read the whole roster of any match they're in.
CREATE POLICY "wp_select" ON public.wager_participants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.wager_participants me
            WHERE me.wager_id = wager_participants.wager_id AND me.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.wagers w WHERE w.id = wager_id AND w.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

-- Users add themselves (join). Only into a match still open for players.
CREATE POLICY "wp_insert_self" ON public.wager_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.wagers w
                WHERE w.id = wager_id AND w.status = 'awaiting_opponent' AND w.format <> '1v1')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.wager_participants;

-- Escrow: lock a participant's stake when they join a ranked multiplayer match.
CREATE OR REPLACE FUNCTION public.escrow_on_join()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w RECORD;
BEGIN
  SELECT mode, stake_points INTO w FROM public.wagers WHERE id = NEW.wager_id;
  IF w.mode = 'ranked' AND w.stake_points > 0 THEN
    PERFORM lock_stake(NEW.user_id, w.stake_points);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS escrow_on_join_trg ON public.wager_participants;
CREATE TRIGGER escrow_on_join_trg
  AFTER INSERT ON public.wager_participants
  FOR EACH ROW EXECUTE FUNCTION public.escrow_on_join();

-- Zero-sum multiplayer settlement. Winners share the losers' staked points
-- equally; escrow is released for everyone first so no balance goes negative.
-- FFA: p_winner_user is the sole winner. Teams: p_winner_team wins for its side.
CREATE OR REPLACE FUNCTION public.settle_multiplayer(
  p_wager UUID, p_winner_user UUID, p_winner_team INT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w RECORD;
  n_winners INT;
  n_losers  INT;
  stake INT;
  share INT;
  remainder INT;
  first_winner UUID;
  rec RECORD;
BEGIN
  SELECT * INTO w FROM public.wagers WHERE id = p_wager;
  stake := CASE WHEN w.mode = 'ranked' THEN COALESCE(w.stake_points, 0) ELSE 0 END;

  -- Classify each participant as winner/loser.
  CREATE TEMP TABLE _p ON COMMIT DROP AS
    SELECT user_id, team_no,
      CASE
        WHEN w.format = 'teams' THEN (team_no = p_winner_team)
        ELSE (user_id = p_winner_user)
      END AS is_winner
    FROM public.wager_participants WHERE wager_id = p_wager;

  SELECT count(*) FILTER (WHERE is_winner), count(*) FILTER (WHERE NOT is_winner)
    INTO n_winners, n_losers FROM _p;
  IF n_winners = 0 THEN RAISE EXCEPTION 'No winners resolved'; END IF;

  -- Release everyone's escrow.
  IF stake > 0 THEN
    FOR rec IN SELECT user_id FROM _p LOOP
      PERFORM release_stake(rec.user_id, stake);
    END LOOP;
  END IF;

  share := CASE WHEN n_winners > 0 THEN (n_losers * stake) / n_winners ELSE 0 END;
  remainder := (n_losers * stake) - (share * n_winners);
  SELECT user_id INTO first_winner FROM _p WHERE is_winner ORDER BY user_id LIMIT 1;

  -- Winners: +share (+remainder to one winner), W. Losers: -stake, L.
  FOR rec IN SELECT * FROM _p LOOP
    IF rec.is_winner THEN
      UPDATE public.profiles
         SET wins = wins + 1,
             points = points + share + CASE WHEN rec.user_id = first_winner THEN remainder ELSE 0 END,
             updated_at = NOW()
       WHERE id = rec.user_id;
      IF stake > 0 THEN
        INSERT INTO public.points_ledger (user_id, wager_id, type, amount, description)
        VALUES (rec.user_id, p_wager, 'won',
                share + CASE WHEN rec.user_id = first_winner THEN remainder ELSE 0 END,
                'Won · ' || COALESCE(w.category, w.sport::text, 'match'));
      END IF;
    ELSE
      UPDATE public.profiles SET losses = losses + 1, points = points - stake, updated_at = NOW()
       WHERE id = rec.user_id;
      IF stake > 0 THEN
        INSERT INTO public.points_ledger (user_id, wager_id, type, amount, description)
        VALUES (rec.user_id, p_wager, 'lost', -stake,
                'Lost · ' || COALESCE(w.category, w.sport::text, 'match'));
      END IF;
    END IF;
  END LOOP;

  UPDATE public.wagers
     SET status = 'completed',
         confirmed_winner_id = p_winner_user,
         confirmed_winner_team = p_winner_team,
         updated_at = NOW()
   WHERE id = p_wager;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_multiplayer(uuid, uuid, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.settle_multiplayer(uuid, uuid, int) TO service_role;

-- Make the 1v1 escrow triggers format-aware: for multiplayer, stakes are
-- locked per participant (escrow_on_join) and released here on cancel.
CREATE OR REPLACE FUNCTION public.escrow_on_create()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.format = '1v1' AND NEW.mode = 'ranked' AND NEW.stake_points > 0
     AND NEW.status = 'awaiting_opponent' THEN
    PERFORM lock_stake(NEW.created_by, NEW.stake_points);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.escrow_on_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec RECORD;
BEGIN
  IF NEW.mode <> 'ranked' OR NEW.stake_points <= 0 THEN RETURN NEW; END IF;

  IF NEW.format = '1v1' THEN
    IF OLD.status = 'awaiting_opponent' AND NEW.status = 'active' AND NEW.opponent_id IS NOT NULL THEN
      PERFORM lock_stake(NEW.opponent_id, NEW.stake_points);
    END IF;
    IF NEW.status IN ('cancelled','refunded') AND OLD.status NOT IN ('cancelled','refunded','completed') THEN
      PERFORM release_stake(NEW.created_by, NEW.stake_points);
      IF NEW.opponent_id IS NOT NULL AND OLD.status <> 'awaiting_opponent' THEN
        PERFORM release_stake(NEW.opponent_id, NEW.stake_points);
      END IF;
    END IF;
  ELSE
    -- Multiplayer: release every participant's stake if the match is voided.
    IF NEW.status IN ('cancelled','refunded') AND OLD.status NOT IN ('cancelled','refunded','completed') THEN
      FOR rec IN SELECT user_id FROM public.wager_participants WHERE wager_id = NEW.id LOOP
        PERFORM release_stake(rec.user_id, NEW.stake_points);
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
