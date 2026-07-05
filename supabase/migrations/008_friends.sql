-- Social graph: friend requests + a friends-scoped leaderboard.

CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE public.friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       friendship_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id, status);
CREATE INDEX friendships_requester_idx ON public.friendships (requester_id, status);

-- RLS: either party can read/update the row; only the requester can create it.
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select_parties" ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert_own" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update_parties" ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- Leaderboard over the caller + their accepted friends, computed from settled
-- wagers. metric = 'net' (default) orders by net winnings; 'rate' by win rate.
CREATE OR REPLACE FUNCTION public.get_leaderboard(metric TEXT DEFAULT 'net')
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  username     TEXT,
  wins         INT,
  losses       INT,
  win_rate     INT,
  net_cents    BIGINT,
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
  ),
  stats AS (
    SELECT
      c.uid,
      COUNT(*) FILTER (WHERE w.confirmed_winner_id = c.uid) AS wins,
      COUNT(*) FILTER (WHERE w.confirmed_winner_id IS NOT NULL AND w.confirmed_winner_id <> c.uid) AS losses,
      COALESCE(SUM(
        CASE
          WHEN w.confirmed_winner_id = c.uid
            THEN (w.wager_amount_cents * 2) - ROUND(w.wager_amount_cents * 2 * w.platform_fee_pct / 100)
          WHEN w.confirmed_winner_id IS NOT NULL
            THEN -w.wager_amount_cents
          ELSE 0
        END
      ), 0) AS net_cents
    FROM circle c
    LEFT JOIN wagers w
      ON w.status = 'completed'
     AND (w.created_by = c.uid OR w.opponent_id = c.uid)
    GROUP BY c.uid
  )
  SELECT
    s.uid,
    p.display_name,
    p.username,
    s.wins::INT,
    s.losses::INT,
    CASE WHEN (s.wins + s.losses) > 0
      THEN ROUND(s.wins::NUMERIC / (s.wins + s.losses) * 100)::INT
      ELSE 0 END,
    s.net_cents::BIGINT,
    (s.uid = me)
  FROM stats s
  JOIN profiles p ON p.id = s.uid
  ORDER BY
    CASE WHEN metric = 'rate'
      THEN CASE WHEN (s.wins + s.losses) > 0 THEN s.wins::NUMERIC / (s.wins + s.losses) ELSE 0 END
      ELSE s.net_cents END DESC;
END;
$$;
