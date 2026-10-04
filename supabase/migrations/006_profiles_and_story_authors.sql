CREATE TABLE IF NOT EXISTS public.family_history_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.family_history_profiles
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO public.family_history_profiles (id, full_name, email, avatar_url)
SELECT
  id,
  COALESCE(NULLIF(raw_user_meta_data->>'full_name', ''), split_part(email, '@', 1), ''),
  email,
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_family_history_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.family_history_profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1), ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
          WHEN NULLIF(NEW.raw_user_meta_data->>'full_name', '') IS NOT NULL
            THEN NEW.raw_user_meta_data->>'full_name'
          ELSE public.family_history_profiles.full_name
        END,
        email = NEW.email,
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', public.family_history_profiles.avatar_url),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_family_history_profile_from_auth_user ON auth.users;
CREATE TRIGGER sync_family_history_profile_from_auth_user
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_family_history_profile_from_auth_user();

CREATE OR REPLACE FUNCTION public.is_profile_visible_to_family(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members AS viewer
    JOIN public.family_members AS target
      ON target.family_id = viewer.family_id
    WHERE viewer.user_id = auth.uid()
      AND target.user_id = target_user_id
      AND viewer.status = 'active'
      AND target.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_profile_visible_to_family(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_visible_to_family(uuid) TO authenticated;

ALTER TABLE public.family_history_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own and family profiles" ON public.family_history_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.family_history_profiles;

CREATE POLICY "Users can read own and family profiles" ON public.family_history_profiles
  FOR SELECT
  USING (id = auth.uid() OR public.is_profile_visible_to_family(id));

CREATE POLICY "Users can update own profile" ON public.family_history_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stories_author_id_family_history_profiles_fkey'
      AND conrelid = 'public.stories'::regclass
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_author_id_family_history_profiles_fkey
      FOREIGN KEY (author_id) REFERENCES public.family_history_profiles(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memories_author_id_family_history_profiles_fkey'
      AND conrelid = 'public.memories'::regclass
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_author_id_family_history_profiles_fkey
      FOREIGN KEY (author_id) REFERENCES public.family_history_profiles(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'family_members_user_id_family_history_profiles_fkey'
      AND conrelid = 'public.family_members'::regclass
  ) THEN
    ALTER TABLE public.family_members
      ADD CONSTRAINT family_members_user_id_family_history_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.family_history_profiles(id) ON DELETE CASCADE;
  END IF;
END;
$$;