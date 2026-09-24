-- Public links get their own AI-summary (recaps) permission
ALTER TABLE public.share_links
  ADD COLUMN IF NOT EXISTS show_recaps boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.create_share_link(_team_id uuid, _show_fines boolean, _show_votes boolean, _show_recaps boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_token uuid;
BEGIN

  -- User must be an editor/owner of this team
  IF NOT public.can_edit_team(_team_id) THEN
    RAISE EXCEPTION 'Not allowed to manage this team';
  END IF;

  -- At least one section must be shared
  IF NOT (_show_fines OR _show_votes OR _show_recaps) THEN
    RAISE EXCEPTION 'A share link must show fines, votes, or AI summaries';
  END IF;

  INSERT INTO public.share_links (
    team_id,
    show_fines,
    show_votes,
    show_recaps,
    created_by
  )
  VALUES (
    _team_id,
    _show_fines,
    _show_votes,
    _show_recaps,
    auth.uid()
  )
  RETURNING token INTO new_token;

  RETURN new_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_share_bundle(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  share_row public.share_links%ROWTYPE;
  team_row public.teams%ROWTYPE;
BEGIN

  -- Find an active share link
  SELECT *
  INTO share_row
  FROM public.share_links
  WHERE token = _token
    AND active = true;

  -- Invalid or disabled link
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Find the team belonging to this link
  SELECT *
  INTO team_row
  FROM public.teams
  WHERE id = share_row.team_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(

    -- Permissions belonging to THIS specific link
    'share',
    jsonb_build_object(
      'show_fines', share_row.show_fines,
      'show_votes', share_row.show_votes,
      'show_recaps', share_row.show_recaps
    ),

    -- Public team information
    'team',
    jsonb_build_object(
      'id', team_row.id,
      'owner_id', '',
      'name', team_row.name,
      'slug', team_row.slug,
      'sport', team_row.sport,
      'season_name', team_row.season_name,
      'logo_url', team_row.logo_url,
      'accent_color', team_row.accent_color,
      'vote_format', team_row.vote_format,

      -- For this share page these values come from the LINK,
      -- not from the team's normal public settings.
      'votes_public', share_row.show_votes,
      'is_public', share_row.show_fines,

      'player_limit', team_row.player_limit,
      'currency', team_row.currency
    ),

    -- Players are required for both fines and voting
    'players',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name)
        FROM public.players p
        WHERE p.team_id = share_row.team_id
      ),
      '[]'::jsonb
    ),

    -- Rounds are required for both fines and voting
    'rounds',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(r) ORDER BY r.round_number)
        FROM public.rounds r
        WHERE r.team_id = share_row.team_id
      ),
      '[]'::jsonb
    ),

    -- Fine categories are returned only when this link allows fines
    'categories',
    CASE
      WHEN share_row.show_fines THEN
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(c) ORDER BY c.label)
            FROM public.fine_categories c
            WHERE c.team_id = share_row.team_id
          ),
          '[]'::jsonb
        )
      ELSE '[]'::jsonb
    END,

    -- Fines are returned only when this link allows fines
    'fines',
    CASE
      WHEN share_row.show_fines THEN
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC)
            FROM public.fines f
            WHERE f.team_id = share_row.team_id
          ),
          '[]'::jsonb
        )
      ELSE '[]'::jsonb
    END,

    -- Votes are returned only when this link allows votes
    'votes',
    CASE
      WHEN share_row.show_votes THEN
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(v))
            FROM public.votes v
            WHERE v.team_id = share_row.team_id
          ),
          '[]'::jsonb
        )
      ELSE '[]'::jsonb
    END,

    -- AI summaries (recaps) are returned only when this link allows them
    'recaps',
    CASE
      WHEN share_row.show_recaps THEN
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC)
            FROM public.recaps r
            WHERE r.team_id = share_row.team_id
          ),
          '[]'::jsonb
        )
      ELSE '[]'::jsonb
    END
  );

END;
$function$;