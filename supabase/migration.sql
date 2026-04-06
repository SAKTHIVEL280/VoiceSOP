-- =============================================
-- VoiceSOP Security Migration (one-time)
-- Paste this into Supabase SQL Editor and run.
-- =============================================

-- 1. Fix profiles SELECT policy (was "viewable by everyone" → own profile only)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON profiles;
CREATE POLICY "Users can view own profile."
  ON profiles FOR SELECT USING (auth.uid() = id);

-- 2. Add performance indexes on sops
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON public.sops (user_id);
CREATE INDEX IF NOT EXISTS idx_sops_user_id_created ON public.sops (user_id, created_at DESC);

-- 3. Add subscription_tier column (if missing) + CHECK constraint
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier text DEFAULT 'free';
  END IF;

  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'pro'));
  END IF;
END $$;

-- 3b. Add lifetime free quota columns for profile-based free limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_total_limit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_total_limit integer NOT NULL DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_total_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_total_used integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_free_sop_total_limit_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_free_sop_total_limit_check
      CHECK (free_sop_total_limit >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_free_sop_total_used_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_free_sop_total_used_check
      CHECK (free_sop_total_used >= 0);
  END IF;
END $$;

-- 3c. Add monthly free quota and storage cap columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_monthly_limit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_monthly_limit integer NOT NULL DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_monthly_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_monthly_used integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_month_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_month_key text NOT NULL DEFAULT to_char(now() at time zone 'utc', 'YYYY-MM');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_sop_storage_limit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN free_sop_storage_limit integer NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_free_sop_monthly_limit_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_free_sop_monthly_limit_check
      CHECK (free_sop_monthly_limit >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_free_sop_monthly_used_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_free_sop_monthly_used_check
      CHECK (free_sop_monthly_used >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_free_sop_storage_limit_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_free_sop_storage_limit_check
      CHECK (free_sop_storage_limit >= 0);
  END IF;
END $$;

-- 4. Make audio-recordings bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'audio-recordings';

-- 5. Fix storage INSERT policy (enforce user folder path)
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Fix storage SELECT policy (restrict to own files only)
DROP POLICY IF EXISTS "Public can view audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
CREATE POLICY "Users can view own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
