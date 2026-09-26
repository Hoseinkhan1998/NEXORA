-- ==============================================================================
-- NEXORA Database Migration: Telegram Mini App & Bot Integration
-- File: supabase/migrations/20260927000000_telegram_integration.sql
-- Description:
-- 1. Adds telegram_id and telegram_username columns to public.profiles.
-- 2. Creates unique index for instant lookup by telegram_id.
-- 3. Provides SECURITY DEFINER function to link or resolve Telegram profiles safely.
-- ==============================================================================

-- 1. Add Telegram columns to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT;

COMMENT ON COLUMN public.profiles.telegram_id IS 'Unique Telegram User ID for Telegram Mini App & Bot integration';
COMMENT ON COLUMN public.profiles.telegram_username IS 'Telegram handle / username (without @)';

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_username ON public.profiles(telegram_username);

-- 3. Function to link an existing profile with a verified Telegram ID
CREATE OR REPLACE FUNCTION public.link_telegram_account(
  p_telegram_id BIGINT,
  p_telegram_username TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if another profile already claimed this telegram_id
  SELECT id INTO v_existing_id
  FROM public.profiles
  WHERE telegram_id = p_telegram_id AND id != v_user_id;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'This Telegram account is already linked to another NEXORA user.';
  END IF;

  -- Update caller profile
  UPDATE public.profiles
  SET 
    telegram_id = p_telegram_id,
    telegram_username = COALESCE(p_telegram_username, telegram_username),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'telegram_id', p_telegram_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_telegram_account(BIGINT, TEXT) TO authenticated;
