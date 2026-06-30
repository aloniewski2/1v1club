-- Wallet ledger: an append-only record of every money movement per user.
-- Winnings accrue here (instead of an immediate Stripe transfer); Cash Out
-- debits the balance and performs the actual transfer.

CREATE TYPE ledger_type AS ENUM (
  'winnings',      -- credit: payout of a won wager (pot - platform fee)
  'platform_fee',  -- record-only: fee retained by the platform
  'stake_hold',    -- debit (display/escrow): stake paid into a wager
  'stake_release', -- credit (display/escrow): stake returned on cancel/refund
  'refund',        -- credit: refunded stake back to wallet
  'cashout',       -- debit: withdrawal to the user's bank
  'cashout_fee',   -- debit: instant cash-out fee
  'deposit'        -- credit: external top-up (reserved; not used yet)
);

CREATE TYPE ledger_status AS ENUM ('pending', 'settled', 'failed');

CREATE TABLE public.ledger_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wager_id     UUID REFERENCES public.wagers(id) ON DELETE SET NULL,
  type         ledger_type NOT NULL,
  -- Signed amount in cents: credits positive, debits negative.
  amount_cents INTEGER NOT NULL,
  status       ledger_status NOT NULL DEFAULT 'settled',
  stripe_ref   TEXT,                 -- transfer / payout id when applicable
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ledger_entries_user_idx ON public.ledger_entries (user_id, created_at DESC);

-- Idempotency marker so process-payout credits the wallet exactly once.
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS wallet_credited_at TIMESTAMPTZ;

-- RLS: a user can read only their own ledger; writes are service-role only
-- (edge functions bypass RLS), so no INSERT/UPDATE policy is granted to users.
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_select_own" ON public.ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_entries;

-- Single-call balance for the wallet UI.
--   available = spendable wallet funds (winnings - cash-outs + refunds/deposits)
--   escrow    = stakes currently held in open wagers (display only)
CREATE OR REPLACE FUNCTION public.get_wallet_balance()
RETURNS TABLE (available_cents BIGINT, escrow_cents BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(SUM(amount_cents) FILTER (
      WHERE status = 'settled'
      AND type IN ('winnings', 'cashout', 'cashout_fee', 'refund', 'deposit')
    ), 0)::BIGINT AS available_cents,
    COALESCE(-SUM(amount_cents) FILTER (
      WHERE status IN ('settled', 'pending')
      AND type IN ('stake_hold', 'stake_release')
    ), 0)::BIGINT AS escrow_cents
  FROM public.ledger_entries
  WHERE user_id = auth.uid();
$$;
