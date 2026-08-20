-- allow pending invites (no user yet)
ALTER TABLE public.team_access ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.team_access ADD COLUMN IF NOT EXISTS invited_email text;

UPDATE public.team_access SET invited_email = lower(email) WHERE invited_email IS NULL AND email IS NOT NULL;

ALTER TABLE public.team_access ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS team_access_team_email_uniq
  ON public.team_access (team_id, lower(invited_email))
  WHERE invited_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_access_team_user_uniq
  ON public.team_access (team_id, user_id)
  WHERE user_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_access TO authenticated;
GRANT ALL ON public.team_access TO service_role;

-- claim pending invites for a signed-in user by their email
CREATE OR REPLACE FUNCTION public.claim_team_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _count integer := 0;
BEGIN
  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = auth.uid();
  IF _email IS NULL THEN RETURN 0; END IF;

  UPDATE public.team_access a
     SET user_id = auth.uid()
   WHERE a.user_id IS NULL
     AND lower(a.invited_email) = _email
     AND NOT EXISTS (
       SELECT 1 FROM public.team_access b
        WHERE b.team_id = a.team_id AND b.user_id = auth.uid()
     );
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_team_invites() TO authenticated;

-- also claim automatically at sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.team_access a
     SET user_id = NEW.id
   WHERE a.user_id IS NULL
     AND lower(a.invited_email) = lower(NEW.email);

  RETURN NEW;
END; $$;

-- teams list must include teams shared with me
DROP POLICY IF EXISTS "editors view team" ON public.teams;
CREATE POLICY "editors view team" ON public.teams
  FOR SELECT TO authenticated
  USING (public.can_edit_team(id));
