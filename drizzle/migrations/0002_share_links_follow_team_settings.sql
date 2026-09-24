CREATE OR REPLACE FUNCTION public.get_share_bundle(_token uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  s public.share_links%ROWTYPE;
  t public.teams%ROWTYPE;
  f boolean; v boolean; r boolean;
BEGIN
  SELECT * INTO s FROM public.share_links WHERE token = _token AND active = true;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO t FROM public.teams WHERE id = s.team_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Link permissions are capped live by the team's current public settings
  f := s.show_fines AND t.is_public;
  v := s.show_votes AND t.votes_public;
  r := s.show_recaps AND t.is_public;

  RETURN jsonb_build_object(
    'share', jsonb_build_object('show_fines', f, 'show_votes', v, 'show_recaps', r),
    'team', jsonb_build_object(
      'id', t.id, 'owner_id', '', 'name', t.name, 'slug', t.slug, 'sport', t.sport,
      'season_name', t.season_name, 'logo_url', t.logo_url, 'accent_color', t.accent_color,
      'vote_format', t.vote_format, 'votes_public', v, 'is_public', f,
      'player_limit', t.player_limit, 'currency', t.currency),
    'players', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name) FROM public.players p WHERE p.team_id = s.team_id), '[]'::jsonb),
    'rounds', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.round_number) FROM public.rounds x WHERE x.team_id = s.team_id), '[]'::jsonb),
    'categories', CASE WHEN f THEN COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.label) FROM public.fine_categories c WHERE c.team_id = s.team_id), '[]'::jsonb) ELSE '[]'::jsonb END,
    'fines', CASE WHEN f THEN COALESCE((SELECT jsonb_agg(to_jsonb(fi) ORDER BY fi.created_at DESC) FROM public.fines fi WHERE fi.team_id = s.team_id), '[]'::jsonb) ELSE '[]'::jsonb END,
    'votes', CASE WHEN v THEN COALESCE((SELECT jsonb_agg(to_jsonb(vo)) FROM public.votes vo WHERE vo.team_id = s.team_id), '[]'::jsonb) ELSE '[]'::jsonb END,
    'recaps', CASE WHEN r THEN COALESCE((SELECT jsonb_agg(to_jsonb(rc) ORDER BY rc.created_at DESC) FROM public.recaps rc WHERE rc.team_id = s.team_id), '[]'::jsonb) ELSE '[]'::jsonb END
  );
END;
$function$;