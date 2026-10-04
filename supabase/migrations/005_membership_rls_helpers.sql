CREATE OR REPLACE FUNCTION public.is_active_family_member(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = target_family_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_family_role(
  target_family_id uuid,
  allowed_roles public.user_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = target_family_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role = ANY (allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_family_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_family_role(uuid, public.user_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_family_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_family_role(uuid, public.user_role[]) TO authenticated;

DROP POLICY IF EXISTS "Members can view family members" ON public.family_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.family_members;

CREATE POLICY "Members can view family members" ON public.family_members
  FOR SELECT
  USING (public.is_active_family_member(family_id));

CREATE POLICY "Admins can manage members" ON public.family_members
  FOR ALL
  USING (public.has_family_role(family_id, ARRAY['owner', 'admin']::public.user_role[]))
  WITH CHECK (public.has_family_role(family_id, ARRAY['owner', 'admin']::public.user_role[]));