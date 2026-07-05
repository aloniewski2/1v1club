-- Persistent trash-talk chat scoped to a wager.
-- Only the two participants can read or write messages.

CREATE TABLE public.wager_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id   UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wager_messages_wager_idx ON public.wager_messages (wager_id, created_at);

ALTER TABLE public.wager_messages ENABLE ROW LEVEL SECURITY;

-- Only participants (creator or opponent) may read messages.
CREATE POLICY "wager_messages_select" ON public.wager_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
        AND (w.created_by = auth.uid() OR w.opponent_id = auth.uid())
    )
  );

-- Only participants may insert, and only as themselves.
CREATE POLICY "wager_messages_insert" ON public.wager_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
        AND (w.created_by = auth.uid() OR w.opponent_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.wager_messages;
