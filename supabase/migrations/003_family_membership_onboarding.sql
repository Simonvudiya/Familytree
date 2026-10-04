CREATE OR REPLACE FUNCTION public.create_family_for_current_user(family_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = auth.uid() AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You already belong to an active family archive';
  END IF;

  IF length(trim(family_name)) < 2 THEN
    RAISE EXCEPTION 'Family name must be at least 2 characters';
  END IF;

  INSERT INTO public.families (name, created_by)
  VALUES (trim(family_name), auth.uid())
  RETURNING id INTO new_family_id;

  INSERT INTO public.family_members (family_id, user_id, role, status)
  VALUES (new_family_id, auth.uid(), 'owner', 'active');

  RETURN new_family_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_family_invitation(invitation_token uuid)
RETURNS TABLE (
  email text,
  role public.user_role,
  family_name text,
  inviter_name text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.email,
    i.role,
    f.name,
    COALESCE(u.raw_user_meta_data->>'full_name', 'A family member'),
    i.expires_at
  FROM public.invitations AS i
  JOIN public.families AS f ON f.id = i.family_id
  JOIN auth.users AS u ON u.id = i.invited_by
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;

CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation public.invitations%ROWTYPE;
  current_email text;
  email_is_confirmed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT lower(email), email_confirmed_at IS NOT NULL
  INTO current_email, email_is_confirmed
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT COALESCE(email_is_confirmed, false) THEN
    RAISE EXCEPTION 'Confirm your email address before accepting this invitation';
  END IF;

  SELECT * INTO invitation
  FROM public.invitations
  WHERE token = invitation_token
  FOR UPDATE;

  IF NOT FOUND OR invitation.status <> 'pending' OR invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation is invalid or expired';
  END IF;

  IF current_email IS NULL OR current_email <> lower(invitation.email) THEN
    RAISE EXCEPTION 'Sign in with the email address this invitation was sent to';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND family_id <> invitation.family_id
  ) THEN
    RAISE EXCEPTION 'This account already belongs to another active family archive';
  END IF;

  INSERT INTO public.family_members (family_id, user_id, role, status, invited_by)
  VALUES (invitation.family_id, auth.uid(), invitation.role, 'active', invitation.invited_by)
  ON CONFLICT (family_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        invited_by = EXCLUDED.invited_by,
        joined_at = now();

  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = invitation.id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_family_for_current_user(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_family_invitation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_family_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_family_for_current_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_invitation(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(uuid) TO authenticated;