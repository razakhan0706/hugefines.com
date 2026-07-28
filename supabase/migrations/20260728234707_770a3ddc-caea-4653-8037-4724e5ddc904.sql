ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS fines_master_photo_url text,
  ADD COLUMN IF NOT EXISTS opponent_logo_url text;