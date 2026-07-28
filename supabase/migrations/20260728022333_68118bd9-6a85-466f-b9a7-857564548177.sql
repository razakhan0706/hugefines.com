-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- teams
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sport text NOT NULL DEFAULT 'Cricket',
  season_name text NOT NULL DEFAULT 'Season 2026',
  logo_url text,
  accent_color text NOT NULL DEFAULT '#16a34a',
  vote_format text NOT NULL DEFAULT '3-2-1',
  votes_public boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  player_limit integer NOT NULL DEFAULT 20,
  currency text NOT NULL DEFAULT '$',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE OR REPLACE FUNCTION public.can_edit_team(_team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams t WHERE t.id = _team_id AND t.owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.team_access a WHERE a.team_id = _team_id AND a.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.team_is_public(_team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams t WHERE t.id = _team_id AND t.is_public);
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public teams viewable" ON public.teams FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "editors view team" ON public.teams FOR SELECT TO authenticated USING (public.can_edit_team(id));
CREATE POLICY "owner insert team" ON public.teams FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "editors update team" ON public.teams FOR UPDATE TO authenticated USING (public.can_edit_team(id)) WITH CHECK (public.can_edit_team(id));
CREATE POLICY "owner delete team" ON public.teams FOR DELETE TO authenticated USING (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_access TO authenticated;
GRANT ALL ON public.team_access TO service_role;
ALTER TABLE public.team_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own access rows" ON public.team_access FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));
CREATE POLICY "owner manages access" ON public.team_access FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

-- players
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  nickname text,
  jersey_number integer,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  label text,
  opponent text,
  played_on date,
  venue text,
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  label text NOT NULL,
  default_amount numeric(10,2) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.rounds(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.fine_categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 1,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, player_id)
);

CREATE TABLE public.recaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.rounds(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'round',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.players (team_id);
CREATE INDEX ON public.rounds (team_id);
CREATE INDEX ON public.fines (team_id);
CREATE INDEX ON public.fines (player_id);
CREATE INDEX ON public.votes (team_id);
CREATE INDEX ON public.recaps (team_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['players','rounds','fine_categories','fines','votes','recaps'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "public read %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (public.team_is_public(team_id))', t);
    EXECUTE format('CREATE POLICY "editors read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.can_edit_team(team_id))', t);
    EXECUTE format('CREATE POLICY "editors write %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.can_edit_team(team_id))', t);
    EXECUTE format('CREATE POLICY "editors update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.can_edit_team(team_id)) WITH CHECK (public.can_edit_team(team_id))', t);
    EXECUTE format('CREATE POLICY "editors delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.can_edit_team(team_id))', t);
  END LOOP;
END $$;

-- votes are only publicly readable once the team reveals them
DROP POLICY "public read votes" ON public.votes;
CREATE POLICY "public read votes" ON public.votes FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.is_public AND t.votes_public));

CREATE OR REPLACE FUNCTION public.enforce_player_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim int; cnt int;
BEGIN
  SELECT player_limit INTO lim FROM public.teams WHERE id = NEW.team_id;
  SELECT count(*) INTO cnt FROM public.players WHERE team_id = NEW.team_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'Player limit of % reached for this team', lim;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER players_limit BEFORE INSERT ON public.players
FOR EACH ROW EXECUTE FUNCTION public.enforce_player_limit();