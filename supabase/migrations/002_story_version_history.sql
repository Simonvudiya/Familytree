CREATE OR REPLACE FUNCTION public.archive_story_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.story_versions (
      story_id,
      title,
      content,
      created_by,
      change_summary
    )
    VALUES (
      OLD.id,
      OLD.title,
      OLD.content,
      COALESCE(auth.uid(), OLD.author_id),
      'Previous version saved automatically'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS archive_story_before_update ON public.stories;

CREATE TRIGGER archive_story_before_update
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.archive_story_before_update();