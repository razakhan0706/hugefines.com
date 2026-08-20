REVOKE EXECUTE ON FUNCTION public.claim_team_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_team_invites() TO authenticated;