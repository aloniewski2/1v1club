-- Security hardening flagged by the Supabase advisor.

-- handle_new_user is a SECURITY DEFINER trigger; pin its search_path and make
-- sure it can't be invoked as an RPC (it only ever runs as a trigger).
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- The wallet/leaderboard RPCs are meant for signed-in users only (they scope by
-- auth.uid() internally). Drop the anon grant.
REVOKE EXECUTE ON FUNCTION public.get_wallet_balance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(TEXT) FROM anon;
