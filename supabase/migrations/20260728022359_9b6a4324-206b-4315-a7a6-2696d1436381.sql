REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enforce_player_limit() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.can_edit_team(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.team_is_public(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.team_is_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_team(uuid) TO authenticated;