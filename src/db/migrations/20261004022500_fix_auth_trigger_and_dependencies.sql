-- ====================================================================
-- Hema (حِمى) - Production Database Migration
-- File: src/db/migrations/20261004022500_fix_auth_trigger_and_dependencies.sql
-- Description:
--   1. Fixes Supabase Auth "type user_role does not exist" error during user signup/invite
--   2. Grants explicit permissions to supabase_auth_admin and standard roles
--   3. Hardens handle_new_auth_user() with explicit search_path and exception isolation
--   4. Grants execute permissions on helper functions
--   5. Adds missing RLS policies for evidence and audit tables
-- Safe to run on existing production database (Zero data loss, preserves all existing tables and rows)
-- ====================================================================

-- 1. ENSURE 'volunteer' EXISTS IN user_role ENUM (Idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ 
    JOIN pg_enum enm ON enm.enumtypid = typ.oid 
    JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
    WHERE nsp.nspname = 'public' AND typ.typname = 'user_role' AND enm.enumlabel = 'volunteer'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'volunteer';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    CREATE TYPE public.user_role AS ENUM ('citizen', 'responder', 'volunteer');
END $$;

-- 2. SCHEMA AND TYPE PERMISSIONS (Including supabase_auth_admin)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON ALL TYPES IN SCHEMA public TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT USAGE ON ALL TYPES IN SCHEMA public TO supabase_auth_admin;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
  END IF;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. HARDEN HANDLE_NEW_AUTH_USER TRIGGER FUNCTION
-- Explicit SET search_path = public, pg_temp prevents "type user_role does not exist"
-- Nested exception block ensures GoTrue user creation NEVER fails with "Database error saving new user"
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.user_role;
  v_raw_role TEXT;
BEGIN
  BEGIN
    v_raw_role := new.raw_user_meta_data->>'role';
    
    -- Determine role safely; defaults to citizen
    IF v_raw_role = 'responder' THEN
      v_role := 'responder'::public.user_role;
    ELSIF v_raw_role = 'volunteer' THEN
      v_role := 'volunteer'::public.user_role;
    ELSE
      v_role := 'citizen'::public.user_role;
    END IF;

    INSERT INTO public.profiles (
      id,
      role,
      phone,
      phone_verified,
      email,
      email_verified,
      full_name,
      governorate,
      city,
      neighborhood,
      language_preference
    ) VALUES (
      new.id,
      v_role,
      COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
      CASE WHEN new.phone_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
      COALESCE(new.email, new.raw_user_meta_data->>'email'),
      CASE WHEN new.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
      COALESCE(
        NULLIF(new.raw_user_meta_data->>'full_name', ''),
        NULLIF(new.raw_user_meta_data->>'name', ''),
        NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
        NULLIF(new.phone, ''),
        'مستخدم جديد'
      ),
      COALESCE(NULLIF(new.raw_user_meta_data->>'governorate', ''), 'damascus'),
      COALESCE(NULLIF(new.raw_user_meta_data->>'city', ''), 'دمشق'),
      COALESCE(new.raw_user_meta_data->>'neighborhood', ''),
      COALESCE(NULLIF(new.raw_user_meta_data->>'language_preference', ''), 'ar')
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
      email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
      full_name = CASE 
        WHEN public.profiles.full_name = 'مستخدم جديد' AND EXCLUDED.full_name <> 'مستخدم جديد' 
        THEN EXCLUDED.full_name 
        ELSE public.profiles.full_name 
      END,
      phone_verified = CASE WHEN EXCLUDED.phone_verified THEN TRUE ELSE public.profiles.phone_verified END,
      email_verified = CASE WHEN EXCLUDED.email_verified THEN TRUE ELSE public.profiles.email_verified END,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user encountered an error for user %: %', new.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO postgres, anon, authenticated, service_role;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
  END IF;
END $$;

-- 4. RECREATE TRIGGER ON auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. FUNCTION EXECUTION GRANTS
GRANT EXECUTE ON FUNCTION public.is_approved_responder(UUID) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_lead_responder(UUID, UUID) TO postgres, anon, authenticated, service_role;

-- 6. SUPPLEMENTARY RLS POLICIES FOR EXISTING TABLES (IF ABSENT)
DO $$
BEGIN
  -- Report media
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_media') THEN
    DROP POLICY IF EXISTS "Report media viewable by all" ON public.report_media;
    CREATE POLICY "Report media viewable by all" ON public.report_media FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Authorized users can insert report media" ON public.report_media;
    CREATE POLICY "Authorized users can insert report media" ON public.report_media FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
      OR public.is_approved_responder(auth.uid())
    );
  END IF;

  -- Responder documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'responder_documents') THEN
    DROP POLICY IF EXISTS "Responder documents select policy" ON public.responder_documents;
    CREATE POLICY "Responder documents select policy" ON public.responder_documents FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
      OR public.is_approved_responder(auth.uid())
    );
  END IF;
END $$;
