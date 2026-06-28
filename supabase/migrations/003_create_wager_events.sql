CREATE TABLE public.wager_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id   UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
