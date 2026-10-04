CREATE OR REPLACE FUNCTION public.can_read_story(
  target_family_id uuid,
  target_author_id uuid,
  target_status public.story_status,
  target_visibility public.story_visibility
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.is_active_family_member(target_family_id) THEN
    RETURN false;
  END IF;

  IF target_author_id = auth.uid() THEN
    RETURN true;
  END IF;

  IF public.has_family_role(target_family_id, ARRAY['owner', 'admin', 'editor']::public.user_role[]) THEN
    RETURN true;
  END IF;

  IF target_status <> 'published' THEN
    RETURN false;
  END IF;

  RETURN target_visibility IN ('family', 'public');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_story(
  target_family_id uuid,
  target_author_id uuid,
  target_status public.story_status
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_author_id = auth.uid()
    AND public.has_family_role(
      target_family_id,
      ARRAY['owner', 'admin', 'editor', 'contributor']::public.user_role[]
    )
    AND (
      target_status <> 'published'
      OR public.has_family_role(target_family_id, ARRAY['owner', 'admin', 'editor']::public.user_role[])
    );
$$;

CREATE OR REPLACE FUNCTION public.prevent_unapproved_story_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND (NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.family_id IS DISTINCT FROM OLD.family_id)
  THEN
    RAISE EXCEPTION 'Story author and family attribution cannot be changed';
  END IF;

  IF NEW.status = 'published'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
    AND NOT public.has_family_role(NEW.family_id, ARRAY['owner', 'admin', 'editor']::public.user_role[])
  THEN
    RAISE EXCEPTION 'Only an editor or administrator can publish a story';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.can_read_story(uuid, uuid, public.story_status, public.story_visibility) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_create_story(uuid, uuid, public.story_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_story(uuid, uuid, public.story_status, public.story_visibility) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_story(uuid, uuid, public.story_status) TO authenticated;

DROP TRIGGER IF EXISTS prevent_unapproved_story_publish ON public.stories;
CREATE TRIGGER prevent_unapproved_story_publish
BEFORE INSERT OR UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unapproved_story_publish();

DROP POLICY IF EXISTS "Family members can view published stories" ON public.stories;
DROP POLICY IF EXISTS "Contributors can create stories" ON public.stories;
DROP POLICY IF EXISTS "Authors and editors can update stories" ON public.stories;

CREATE POLICY "Family members can view allowed stories" ON public.stories
  FOR SELECT
  USING (public.can_read_story(family_id, author_id, status, visibility));

CREATE POLICY "Contributors can create unpublished stories" ON public.stories
  FOR INSERT
  WITH CHECK (public.can_create_story(family_id, author_id, status));

CREATE POLICY "Authors and editors can update stories" ON public.stories
  FOR UPDATE
  USING (
    (author_id = auth.uid() AND public.is_active_family_member(family_id))
    OR public.has_family_role(family_id, ARRAY['owner', 'admin', 'editor']::public.user_role[])
  )
  WITH CHECK (
    (author_id = auth.uid() AND public.is_active_family_member(family_id))
    OR public.has_family_role(family_id, ARRAY['owner', 'admin', 'editor']::public.user_role[])
  );