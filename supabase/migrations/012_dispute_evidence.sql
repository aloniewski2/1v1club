-- Verification hardening: structured disputes, immutable evidence, admin review,
-- and proof-image integrity (server-side hashing + reuse detection).

-- ---------------------------------------------------------------------------
-- 1. Admin flag for the dispute-review console.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- 2. Dispute case: one per wager. Opened when declarations disagree.
-- ---------------------------------------------------------------------------
CREATE TYPE dispute_status AS ENUM ('open', 'resolved');

CREATE TABLE public.wager_disputes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id           UUID NOT NULL UNIQUE REFERENCES public.wagers(id) ON DELETE CASCADE,
  opened_by          UUID REFERENCES public.profiles(id),
  status             dispute_status NOT NULL DEFAULT 'open',
  resolution_winner_id UUID REFERENCES public.profiles(id),
  resolution_note    TEXT,
  resolved_by        UUID REFERENCES public.profiles(id),
  resolved_at        TIMESTAMPTZ,
  -- Each party has this long to submit evidence once a dispute opens.
  evidence_deadline  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '3 days',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wager_disputes_status_idx ON public.wager_disputes (status, created_at);

ALTER TABLE public.wager_disputes ENABLE ROW LEVEL SECURITY;

-- Participants of the wager can read their dispute; admins can read all.
CREATE POLICY "wager_disputes_select" ON public.wager_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
        AND (w.created_by = auth.uid() OR w.opponent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );
-- Writes are service-role only (edge functions).

-- ---------------------------------------------------------------------------
-- 3. Per-party dispute submission: a statement + evidence, IMMUTABLE once made.
--    No UPDATE/DELETE policy is granted to anyone -> append-only by design.
-- ---------------------------------------------------------------------------
CREATE TABLE public.dispute_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id     UUID NOT NULL REFERENCES public.wager_disputes(id) ON DELETE CASCADE,
  wager_id       UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  statement      TEXT NOT NULL CHECK (char_length(statement) <= 2000),
  evidence_paths TEXT[] NOT NULL DEFAULT '{}',
  claimed_winner_id UUID REFERENCES public.profiles(id),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dispute_id, user_id)   -- one locked submission per party
);

CREATE INDEX dispute_submissions_dispute_idx ON public.dispute_submissions (dispute_id);

ALTER TABLE public.dispute_submissions ENABLE ROW LEVEL SECURITY;

-- Participants + admins can read submissions for their dispute.
CREATE POLICY "dispute_submissions_select" ON public.dispute_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
        AND (w.created_by = auth.uid() OR w.opponent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );
-- INSERT is service-role only (via submit-dispute-evidence), keeping it immutable
-- and validated. No UPDATE/DELETE policy = rows can never be altered.

ALTER PUBLICATION supabase_realtime ADD TABLE public.wager_disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispute_submissions;

-- ---------------------------------------------------------------------------
-- 4. Proof integrity: server-computed SHA-256 of every uploaded proof image,
--    so reused / recycled screenshots across wagers are detectable.
-- ---------------------------------------------------------------------------
CREATE TABLE public.proof_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id      UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  sha256        TEXT NOT NULL,
  context       TEXT NOT NULL,           -- 'declaration' | 'dispute'
  duplicate_of  UUID REFERENCES public.proof_assets(id),  -- set if hash seen before
  byte_size     BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX proof_assets_sha_idx     ON public.proof_assets (sha256);
CREATE INDEX proof_assets_wager_idx   ON public.proof_assets (wager_id);

ALTER TABLE public.proof_assets ENABLE ROW LEVEL SECURITY;

-- Participants + admins can read proof metadata for their wager.
CREATE POLICY "proof_assets_select" ON public.proof_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wagers w
      WHERE w.id = wager_id
        AND (w.created_by = auth.uid() OR w.opponent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );
-- Writes are service-role only (register-proof computes the hash server-side).
