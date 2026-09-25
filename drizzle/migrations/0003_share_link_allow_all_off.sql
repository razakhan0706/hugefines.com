CREATE OR REPLACE FUNCTION public.create_share_link(_team_id uuid, _show_fines boolean, _show_votes boolean, _show_recaps boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_token uuid;
BEGIN
  IF NOT public.can_edit_team(_team_id) THEN
    RAISE EXCEPTION 'Not allowed to manage this team';
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

DROP FUNCTION public.create_share_link(uuid, boolean, boolean);