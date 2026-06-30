-- Wagerly Pro: subscription state on the profile. Source of truth is Stripe;
-- these columns are a synced cache updated by the webhook / sync endpoint.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS is_pro               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_status  TEXT,        -- active | trialing | past_due | canceled | ...
  ADD COLUMN IF NOT EXISTS pro_until            TIMESTAMPTZ;  -- current period end

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx ON public.profiles (stripe_customer_id);
