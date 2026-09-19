BEGIN;

CREATE OR REPLACE FUNCTION public.create_share_link(
  _team_id uuid,
  _show_fines boolean,
  _show_votes boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token uuid;
BEGIN

  -- User must be an editor/owner of this team
  IF NOT public.can_edit_team(_team_id) THEN
    RAISE EXCEPTION 'Not allowed to manage this team';
  END IF;

  -- At least one section must be shared
  IF NOT (_show_fines OR _show_votes) THEN
    RAISE EXCEPTION 'A share link must show fines, votes, or both';
  END IF;

  INSERT INTO public.share_links (
    team_id,
    show_fines,
    show_votes,
    created_by
  )
  VALUES (
    _team_id,
    _show_fines,
    _show_votes,
    auth.uid()
  )
  RETURNING token INTO new_token;

  RETURN new_token;
END;
$$;

REVOKE ALL
ON FUNCTION public.create_share_link(uuid, boolean, boolean)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.create_share_link(uuid, boolean, boolean)
TO authenticated;

COMMIT;