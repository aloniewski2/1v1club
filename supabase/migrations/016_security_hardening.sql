-- Security hardening (bug bash / security review).
--
-- FIX 1 (CRITICAL): settle_match / record_match_result are SECURITY DEFINER and
-- were EXECUTE-able by anon/authenticated via PostgREST RPC, letting any user
-- award themselves arbitrary points. Restrict to the service role (edge fns).
REVOKE EXECUTE ON FUNCTION public.settle_match(uuid, uuid, integer, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_match_result(uuid, uuid, boolean)       FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.settle_match(uuid, uuid, integer, uuid, text) TO service_role;
GRANT  EXECUTE ON FUNCTION public.record_match_result(uuid, uuid, boolean)      TO service_role;

-- Dead legacy read fn (wallet removed) — trim its surface.
REVOKE EXECUTE ON FUNCTION public.get_wallet_balance() FROM anon;

-- FIX 2 (CRITICAL): profiles_update_own had no column restriction, so a user
-- could PATCH their own points / wins / losses / is_admin / is_pro etc. A
-- column-level REVOKE is a no-op while a table-level UPDATE grant exists, so we
-- revoke table UPDATE entirely and grant back only the cosmetic columns. All
-- trust-sensitive columns are now writable by the service role only.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT  UPDATE (display_name, username, avatar_url, updated_at) ON public.profiles TO authenticated;

-- FIX 3 (HIGH): wagers_update_parties had no WITH CHECK, so a participant could
-- mutate any column (confirmed_winner_id, stake_points, status, created_by…).
-- The only legitimate client update is a non-participant accepting the invite:
-- opponent_id NULL -> self, status 'awaiting_opponent' -> 'active'. Everything
-- else (declare, dispute, settle, cancel) runs server-side as the service role.
CREATE OR REPLACE FUNCTION public.guard_wager_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Service role (edge functions) bypasses the guard entirely.
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Only the accept transition is allowed from the client.
  IF OLD.status = 'awaiting_opponent'
     AND NEW.status = 'active'
     AND OLD.opponent_id IS NULL
     AND NEW.opponent_id = auth.uid()
     AND NEW.created_by = OLD.created_by
     AND NEW.stake_points = OLD.stake_points
     AND NEW.mode = OLD.mode
     AND NEW.confirmed_winner_id IS NULL
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed: matches are settled by the server, not the client';
END;
$$;

DROP TRIGGER IF EXISTS guard_wager_update_trg ON public.wagers;
CREATE TRIGGER guard_wager_update_trg
  BEFORE UPDATE ON public.wagers
  FOR EACH ROW EXECUTE FUNCTION public.guard_wager_update();
