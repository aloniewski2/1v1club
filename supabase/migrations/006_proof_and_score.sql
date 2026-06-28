-- Add per-player score and proof image columns
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS creator_score       TEXT,
  ADD COLUMN IF NOT EXISTS opponent_score      TEXT,
  ADD COLUMN IF NOT EXISTS creator_proof_path  TEXT,
  ADD COLUMN IF NOT EXISTS opponent_proof_path TEXT;

-- Storage bucket for proof images (private — accessed via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wager-proofs', 'wager-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Any authenticated user can upload a proof image
CREATE POLICY "wager_proofs_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wager-proofs');

-- Any authenticated user can read proof images (path is not guessable; wager RLS guards the path)
CREATE POLICY "wager_proofs_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wager-proofs');
