-- Free-to-play pivot: matches are competitions for POINTS/RANKING, not money.
-- No stakes, no escrow, no payouts. Cash columns are left in place (unused) for
-- history; the active flow no longer touches them.

-- Per-player ranking stats.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wins   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0;

-- Ranked matches move the leaderboard; casual matches are just for fun.
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'ranked';

-- Points awarded to the winner of a ranked match.
-- (Kept as a constant in one place so the app and DB agree.)
-- win = +25, recorded W/L; casual matches award 0 but still record the result.

-- Settle a completed match: increment winner/loser stats exactly once.
-- Service-role edge functions call this; SECURITY DEFINER so it can update
-- profiles regardless of RLS.
CREATE OR REPLACE FUNCTION public.record_match_result(
  p_winner UUID, p_loser UUID, p_ranked BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
     SET wins = wins + 1,
         points = points + CASE WHEN p_ranked THEN 25 ELSE 0 END,
         updated_at = NOW()
   WHERE id = p_winner;
  UPDATE public.profiles
     SET losses = losses + 1,
         updated_at = NOW()
   WHERE id = p_loser;
END;
$$;

-- Leaderboard over the caller + accepted friends, ranked by points then win rate.
CREATE OR REPLACE FUNCTION public.get_leaderboard(metric TEXT DEFAULT 'points')
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  username     TEXT,
  wins         INT,
  losses       INT,
  win_rate     INT,
  net_cents    BIGINT,   -- kept for response-shape compatibility; now = points
  is_me        BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
BEGIN
  RETURN QUERY
  WITH circle AS (
    SELECT me AS uid
    UNION
    SELECT CASE WHEN f.requester_id = me THEN f.addressee_id ELSE f.requester_id END
    FROM friendships f
    WHERE f.status = 'accepted' AND (f.requester_id = me OR f.addressee_id = me)
  )
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.wins::INT,
    p.losses::INT,
    CASE WHEN (p.wins + p.losses) > 0
      THEN ROUND(p.wins::NUMERIC / (p.wins + p.losses) * 100)::INT
      ELSE 0 END,
    p.points::BIGINT,
    (p.id = me)
  FROM circle c
  JOIN profiles p ON p.id = c.uid
  ORDER BY
    CASE WHEN metric = 'rate'
      THEN CASE WHEN (p.wins + p.losses) > 0 THEN p.wins::NUMERIC / (p.wins + p.losses) ELSE 0 END
      ELSE p.points END DESC;
END;
$$;
