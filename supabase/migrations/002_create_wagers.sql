CREATE TYPE wager_status AS ENUM (
  'pending_payment',
  'awaiting_opponent',
  'opponent_joined',
  'active',
  'declaring',
  'disputed',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE sport_type AS ENUM (
  'golf', 'basketball', 'tennis', 'pickleball', 'chess',
  'gaming', 'ping_pong', 'pool', 'bowling', 'darts', 'other'
);

CREATE TABLE public.wagers (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        TEXT UNIQUE NOT NULL,
  created_by                  UUID NOT NULL REFERENCES public.profiles(id),
  opponent_id                 UUID REFERENCES public.profiles(id),
  sport                       sport_type NOT NULL,
  custom_sport_label          TEXT,
  description                 TEXT NOT NULL,
  match_date                  DATE,
  wager_amount_cents          INTEGER NOT NULL,
  platform_fee_pct            NUMERIC(4,2) NOT NULL DEFAULT 5.00,
  status                      wager_status NOT NULL DEFAULT 'pending_payment',
  invite_token                TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  invite_expires_at           TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  creator_payment_intent_id   TEXT,
  opponent_payment_intent_id  TEXT,
  creator_charge_id           TEXT,
  opponent_charge_id          TEXT,
  payout_transfer_id          TEXT,
  declared_winner_by_creator  UUID REFERENCES public.profiles(id),
  declared_winner_by_opponent UUID REFERENCES public.profiles(id),
  confirmed_winner_id         UUID REFERENCES public.profiles(id),
  creator_paid_at             TIMESTAMPTZ,
  opponent_paid_at            TIMESTAMPTZ,
  declaration_deadline        TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
