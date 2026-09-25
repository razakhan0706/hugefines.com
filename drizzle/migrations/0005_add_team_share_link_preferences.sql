ALTER TABLE public.teams
  ADD COLUMN share_show_fines boolean NOT NULL DEFAULT true,
  ADD COLUMN share_show_votes boolean NOT NULL DEFAULT false,
  ADD COLUMN share_show_recaps boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.teams.share_show_fines IS 'Saved default for whether newly created public links include fines.';
COMMENT ON COLUMN public.teams.share_show_votes IS 'Saved default for whether newly created public links include votes.';
COMMENT ON COLUMN public.teams.share_show_recaps IS 'Saved default for whether newly created public links include AI summaries.';