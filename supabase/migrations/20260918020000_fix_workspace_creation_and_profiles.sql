-- ==============================================================================
-- Migration: Fix Workspace Creation & Self-Healing Profiles
-- ==============================================================================
-- Description:
-- 1. Adds INSERT policy on public.profiles so authenticated users can self-provision.
-- 2. Enhances public.create_workspace_with_owner to automatically ensure the
--    user's profile exists before inserting the workspace (eliminates FK errors).
-- 3. Backfills public.profiles for any existing users in auth.users.
-- ==============================================================================

-- 1. Add INSERT policy on public.profiles for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END $$;

-- 2. Backfill public.profiles for any users already registered in auth.users
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. Self-healing create_workspace_with_owner function
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_workspace public.workspaces%ROWTYPE;
  v_member public.workspace_members%ROWTYPE;
  v_email TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate input length
  IF char_length(trim(p_name)) < 2 OR char_length(trim(p_name)) > 50 THEN
    RAISE EXCEPTION 'Workspace name must be between 2 and 50 characters';
  END IF;

  IF NOT (p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') OR char_length(p_slug) < 2 OR char_length(p_slug) > 60 THEN
    RAISE EXCEPTION 'Invalid workspace slug format';
  END IF;

  -- Self-healing: ensure user profile exists in public.profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    SELECT
      email,
      COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
      raw_user_meta_data->>'avatar_url'
    INTO v_email, v_full_name, v_avatar_url
    FROM auth.users
    WHERE id = v_user_id;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (v_user_id, COALESCE(v_email, ''), v_full_name, v_avatar_url, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      updated_at = NOW();
  END IF;

  -- 1. Insert workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (trim(p_name), p_slug, v_user_id)
  RETURNING * INTO v_workspace;

  -- 2. Insert owner membership record
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, v_user_id, 'owner')
  RETURNING * INTO v_member;

  -- 3. Return created workspace details
  RETURN jsonb_build_object(
    'id', v_workspace.id,
    'name', v_workspace.name,
    'slug', v_workspace.slug,
    'owner_id', v_workspace.owner_id,
    'role', v_member.role,
    'created_at', v_workspace.created_at,
    'updated_at', v_workspace.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT) TO authenticated;
