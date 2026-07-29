ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS two_day boolean NOT NULL DEFAULT false;
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS day integer;
ALTER TABLE public.fines ADD COLUMN IF NOT EXISTS week integer;