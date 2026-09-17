-- Allow the public board when either fines OR votes are public
CREATE OR REPLACE FUNCTION public.team_is_visible(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = _team_id
      AND (t.is_public OR t.votes_public)
  );
$$;

-- Check whether votes are allowed publicly
CREATE OR REPLACE FUNCTION public.team_votes_public(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = _team_id
      AND t.votes_public
  );
$$;

GRANT EXECUTE ON FUNCTION public.team_is_visible(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.team_votes_public(uuid) TO anon, authenticated;

-- Team can be found publicly if either Fines or Votes are public
DROP POLICY IF EXISTS "public teams viewable" ON public.teams;

CREATE POLICY "public teams viewable"
ON public.teams
FOR SELECT
TO anon, authenticated
USING (is_public OR votes_public);

-- Players are needed for both Fines and Votes pages
DROP POLICY IF EXISTS "public read players" ON public.players;

CREATE POLICY "public read players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (public.team_is_visible(team_id));

-- Rounds are needed for both Fines and Votes pages
DROP POLICY IF EXISTS "public read rounds" ON public.rounds;

CREATE POLICY "public read rounds"
ON public.rounds
FOR SELECT
TO anon, authenticated
USING (public.team_is_visible(team_id));

-- Votes should depend only on votes_public
DROP POLICY IF EXISTS "public read votes" ON public.votes;

CREATE POLICY "public read votes"
ON public.votes
FOR SELECT
TO anon, authenticated
USING (public.team_votes_public(team_id));