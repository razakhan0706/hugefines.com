BEGIN;

CREATE TABLE public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id uuid NOT NULL
    REFERENCES public.teams(id)
    ON DELETE CASCADE,

  token uuid NOT NULL
    DEFAULT gen_random_uuid()
    UNIQUE,

  show_fines boolean NOT NULL DEFAULT false,
  show_votes boolean NOT NULL DEFAULT false,

  active boolean NOT NULL DEFAULT true,

  created_by uuid
    DEFAULT auth.uid()
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT share_links_must_show_something
    CHECK (show_fines OR show_votes)
);

CREATE INDEX share_links_team_id_idx
ON public.share_links(team_id);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.share_links
TO authenticated;

GRANT ALL
ON public.share_links
TO service_role;


-- Team editors can see links belonging to their team
CREATE POLICY "editors view share links"
ON public.share_links
FOR SELECT
TO authenticated
USING (public.can_edit_team(team_id));


-- Team editors can create links
CREATE POLICY "editors create share links"
ON public.share_links
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_edit_team(team_id)
  AND created_by = auth.uid()
);


-- Team editors can update/disable links
CREATE POLICY "editors update share links"
ON public.share_links
FOR UPDATE
TO authenticated
USING (public.can_edit_team(team_id))
WITH CHECK (public.can_edit_team(team_id));


-- Team editors can delete links
CREATE POLICY "editors delete share links"
ON public.share_links
FOR DELETE
TO authenticated
USING (public.can_edit_team(team_id));

COMMIT;