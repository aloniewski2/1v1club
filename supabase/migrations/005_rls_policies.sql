-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read, only you can update your own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- wagers: parties can see their own; awaiting_opponent is readable by anyone (for invite link)
CREATE POLICY "wagers_select_parties" ON public.wagers FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = opponent_id
    OR status = 'awaiting_opponent'
  );
CREATE POLICY "wagers_insert_own" ON public.wagers FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "wagers_update_parties" ON public.wagers FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = opponent_id);

-- wager_events: only parties can read; only service_role writes (via Edge Functions)
CREATE POLICY "wager_events_select_parties" ON public.wager_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
      AND (auth.uid() = w.created_by OR auth.uid() = w.opponent_id)
    )
  );

-- notifications: only owner can read/update their own
CREATE POLICY "notifications_own" ON public.notifications
  USING (auth.uid() = user_id);

-- Enable real-time for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wagers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
