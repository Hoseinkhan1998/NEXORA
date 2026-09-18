-- ==============================================================================
-- Migration: Update User Profile RPC & RLS Harmonization
-- ==============================================================================
-- Description:
-- 1. Drops any conflicting or misconfigured RLS policies on public.profiles.
-- 2. Adds clean, standard INSERT and UPDATE policies with auth.uid() = id.
-- 3. Implements atomic SECURITY DEFINER function public.update_user_profile
--    to guarantee profile picture and full name updates always succeed.
-- ==============================================================================

-- 1. Harmonize RLS Policies on public.profiles
DO $$
BEGIN
  -- Re-create INSERT policy
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

  -- Re-create UPDATE policy
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;

-- 2. Create atomic, resilient RPC function for profile updates
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_full_name TEXT,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_profile public.profiles%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, updated_at)
  VALUES (
    v_user_id,
    COALESCE(v_email, ''),
    trim(p_full_name),
    p_avatar_url,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'avatar_url', v_profile.avatar_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT) TO authenticated;
