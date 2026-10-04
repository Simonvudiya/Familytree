ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_year integer,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS location text;

CREATE INDEX IF NOT EXISTS idx_stories_family_event_year
  ON public.stories (family_id, event_year)
  WHERE event_year IS NOT NULL;