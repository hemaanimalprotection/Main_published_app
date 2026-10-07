-- ====================================================================
-- Hema (حِمى) - Final Production Architecture Migration
-- File: supabase/migrations/20261005120000_final_hima_production_architecture.sql
-- Description:
--   1. Secure Admin Architecture (admin_users table, is_admin column, no public admin signup)
--   2. Professional Verification System (review status, rejection reasons, reviewer tracking)
--   3. Private Document Storage & RLS (verification_documents private bucket)
--   4. Adoption & Surrender Persistence (adoption_listings, adoption_applications)
--   5. Emergency Reports & Operations Room Authorization
--   6. Volunteer Dispatches & Local Targeted Notifications
-- SAFE & INCREMENTAL: Preserves all existing users, tables, and data. Zero data loss.
-- ====================================================================

-- 1. EXTENSIONS & SCHEMAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
  END IF;
END $$;

-- 2. DOMAIN ENUMS (Idempotent creation & expansion)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('citizen', 'responder', 'volunteer');
EXCEPTION WHEN duplicate_object THEN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ 
    JOIN pg_enum enm ON enm.enumtypid = typ.oid 
    JOIN pg_namespace nsp ON nsp.oid = typ.typnamespace
    WHERE nsp.nspname = 'public' AND typ.typname = 'user_role' AND enm.enumlabel = 'volunteer'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'volunteer';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.responder_type AS ENUM ('association', 'veterinarian');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_type AS ENUM ('cat', 'dog', 'bird', 'horse_donkey', 'farm_animal', 'wildlife', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.problem_category AS ENUM (
    'abuse_violence', 'injured', 'sick', 'abandoned', 
    'homeless', 'trapped', 'road_accident', 'poisoning', 
    'food_water', 'mother_babies', 'shelter_needed', 'other_emergency'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.severity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM (
    'submitted', 'under_review', 'waiting_responder', 'responsibility_accepted',
    'responder_on_way', 'animal_located', 'receiving_veterinary_care',
    'sheltered_or_fostered', 'adoption_process', 'resolved', 'closed',
    'duplicate', 'invalid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.adoption_status AS ENUM ('draft', 'published', 'reserved', 'adopted', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.collaboration_role AS ENUM ('rescue', 'veterinary_care', 'shelter', 'foster', 'transport', 'food_support', 'adoption');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.collaboration_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant permissions on types
GRANT USAGE ON TYPE public.user_role TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.responder_type TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.verification_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.animal_type TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.problem_category TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.severity_level TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.report_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.adoption_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.application_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.collaboration_role TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.collaboration_status TO anon, authenticated, service_role;

-- 3. PROFILES TABLE ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'citizen'::public.user_role,
  phone VARCHAR(30),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(255),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  full_name VARCHAR(150) NOT NULL DEFAULT 'مستخدم مسجل',
  governorate VARCHAR(50) NOT NULL DEFAULT 'damascus',
  city VARCHAR(100) NOT NULL DEFAULT 'دمشق',
  neighborhood VARCHAR(150),
  avatar_url TEXT,
  volunteer_profile_id UUID,
  language_preference VARCHAR(5) NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure is_admin column exists on profiles (NOT NULL DEFAULT FALSE)
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS volunteer_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. TRUSTED ADMIN USERS TABLE (Prevents any client-side privilege escalation)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title VARCHAR(100) NOT NULL DEFAULT 'مدير النظام',
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if a user is an authorized HIMA administrator
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = uid),
    FALSE
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO postgres, anon, authenticated, service_role;

-- Bootstrap primary platform admin account (sameh.saad.cg@gmail.com)
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'sameh.saad.cg@gmail.com' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    UPDATE public.profiles SET is_admin = TRUE WHERE id = v_admin_id;
    INSERT INTO public.admin_users (user_id, role_title)
    VALUES (v_admin_id, 'مدير المنصة العام')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 5. RESPONDER PROFILES TABLE & VERIFICATION ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.responder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  responder_type public.responder_type NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending'::public.verification_status,
  name VARCHAR(200) NOT NULL,
  title VARCHAR(100),
  specialty VARCHAR(150),
  description TEXT NOT NULL DEFAULT '',
  responsible_contact_person VARCHAR(150),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  governorates_served TEXT[] NOT NULL DEFAULT '{}',
  cities_served TEXT[] NOT NULL DEFAULT '{}',
  services_offered TEXT[] NOT NULL DEFAULT '{}',
  clinic_name VARCHAR(150),
  clinic_address TEXT,
  registration_number VARCHAR(100),
  logo_url TEXT,
  availability VARCHAR(50) NOT NULL DEFAULT 'available',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  supporting_document_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.responder_profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supporting_document_urls TEXT[] NOT NULL DEFAULT '{}';

-- Helper function to check if responder is verified
CREATE OR REPLACE FUNCTION public.is_approved_responder(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.responder_profiles
    WHERE user_id = uid 
      AND verification_status = 'verified'::public.verification_status
  ) OR public.is_admin(uid);
$$;

GRANT EXECUTE ON FUNCTION public.is_approved_responder(UUID) TO postgres, anon, authenticated, service_role;

-- 6. RESPONDER DOCUMENTS TABLE (Private uploaded verification files)
CREATE TABLE IF NOT EXISTS public.responder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responder_id UUID NOT NULL REFERENCES public.responder_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL DEFAULT 'license',
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_kb INT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. VOLUNTEER PROFILES TABLE (Field Volunteers Network)
CREATE TABLE IF NOT EXISTS public.volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255),
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(150),
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  coverage_radius_km NUMERIC(5, 2),
  roles TEXT[] NOT NULL DEFAULT '{}',
  has_vehicle BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(100),
  shelter_capacity_note TEXT,
  other_help_details TEXT,
  experience_note TEXT,
  availability VARCHAR(50) NOT NULL DEFAULT 'available',
  verification_status VARCHAR(50) NOT NULL DEFAULT 'active',
  total_assists_count INT NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ANIMAL REPORTS TABLE (National Emergency Reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(30) NOT NULL UNIQUE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  animal_type public.animal_type NOT NULL,
  animal_count INT NOT NULL DEFAULT 1,
  problem_category public.problem_category NOT NULL,
  severity public.severity_level NOT NULL DEFAULT 'medium'::public.severity_level,
  description TEXT NOT NULL,
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(150) NOT NULL,
  approx_lat NUMERIC(9, 6) NOT NULL,
  approx_lng NUMERIC(9, 6) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_animal_still_there BOOLEAN NOT NULL DEFAULT TRUE,
  can_reporter_stay_nearby BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_contact_method VARCHAR(20) NOT NULL DEFAULT 'phone',
  status public.report_status NOT NULL DEFAULT 'submitted'::public.report_status,
  is_assigned BOOLEAN NOT NULL DEFAULT FALSE,
  lead_responder_id UUID REFERENCES public.responder_profiles(id) ON DELETE SET NULL,
  lead_accepted_at TIMESTAMPTZ,
  assigned_volunteer_id UUID REFERENCES public.volunteer_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if responder is lead on a report
CREATE OR REPLACE FUNCTION public.is_lead_responder(p_report_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.responder_profiles rp ON rp.id = r.lead_responder_id
    WHERE r.id = p_report_id AND rp.user_id = uid
  ) OR public.is_admin(uid);
$$;

GRANT EXECUTE ON FUNCTION public.is_lead_responder(UUID, UUID) TO postgres, anon, authenticated, service_role;

-- 9. REPORT PRIVATE DETAILS (Confidential reporter phone & exact location)
CREATE TABLE IF NOT EXISTS public.report_private_details (
  report_id UUID PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  reporter_phone VARCHAR(30) NOT NULL,
  reporter_address TEXT,
  exact_lat NUMERIC(9, 6) NOT NULL,
  exact_lng NUMERIC(9, 6) NOT NULL,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REPORT MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. REPORT RESPONSIBILITIES & COLLABORATION
CREATE TABLE IF NOT EXISTS public.report_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.responder_profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  relinquished_at TIMESTAMPTZ,
  relinquish_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.report_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.responder_profiles(id) ON DELETE CASCADE,
  requested_role public.collaboration_role NOT NULL,
  status public.collaboration_status NOT NULL DEFAULT 'pending'::public.collaboration_status,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  previous_status public.report_status,
  new_status public.report_status NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. VOLUNTEER DISPATCHES TABLE
CREATE TABLE IF NOT EXISTS public.volunteer_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  report_reference VARCHAR(50),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name VARCHAR(150) NOT NULL,
  sender_type VARCHAR(50) NOT NULL,
  volunteer_id UUID NOT NULL REFERENCES public.volunteer_profiles(id) ON DELETE CASCADE,
  volunteer_name VARCHAR(150) NOT NULL,
  role_needed VARCHAR(50) NOT NULL,
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(150),
  address TEXT,
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'normal',
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ADOPTION & SURRENDER LISTINGS TABLE (Primary source of truth for cross-device/guest browsing)
CREATE TABLE IF NOT EXISTS public.adoption_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_type VARCHAR(30) NOT NULL DEFAULT 'adoption', -- 'adoption' or 'surrender'
  name VARCHAR(100) NOT NULL,
  animal_type public.animal_type NOT NULL,
  breed VARCHAR(100),
  sex VARCHAR(20) NOT NULL DEFAULT 'unknown',
  age_group VARCHAR(20) NOT NULL DEFAULT 'young',
  estimated_age VARCHAR(50) NOT NULL,
  size VARCHAR(20) NOT NULL DEFAULT 'medium',
  health_condition TEXT NOT NULL,
  is_vaccinated BOOLEAN NOT NULL DEFAULT FALSE,
  is_neutered BOOLEAN NOT NULL DEFAULT FALSE,
  special_needs TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  personality TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  good_with_children BOOLEAN NOT NULL DEFAULT TRUE,
  good_with_cats BOOLEAN NOT NULL DEFAULT TRUE,
  good_with_dogs BOOLEAN NOT NULL DEFAULT TRUE,
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  status public.adoption_status NOT NULL DEFAULT 'published'::public.adoption_status,
  applications_count INT NOT NULL DEFAULT 0,
  surrender_reason TEXT,
  contact_phone VARCHAR(30),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.adoption_listings
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(30) NOT NULL DEFAULT 'adoption',
  ADD COLUMN IF NOT EXISTS surrender_reason TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);

-- 14. ADOPTION APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.adoption_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  housing_type VARCHAR(50) NOT NULL,
  has_other_pets BOOLEAN NOT NULL DEFAULT FALSE,
  previous_pet_experience TEXT NOT NULL,
  motivation TEXT NOT NULL,
  status public.application_status NOT NULL DEFAULT 'pending'::public.application_status,
  publisher_feedback TEXT,
  publisher_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title_ar TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  body_fr TEXT NOT NULL,
  related_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  related_adoption_id UUID REFERENCES public.adoption_listings(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PREVENT CLIENT PRIVILEGE ESCALATION TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Prevent non-admins from self-granting is_admin = true
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_admin(auth.uid()) AND current_user NOT IN ('postgres', 'service_role') THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 18. HARDEN HANDLE_NEW_AUTH_USER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.user_role;
  v_raw_role TEXT;
  v_is_admin BOOLEAN := FALSE;
BEGIN
  BEGIN
    v_raw_role := new.raw_user_meta_data->>'role';
    
    -- Role defaults to citizen; 'admin' cannot be granted via client metadata
    IF v_raw_role = 'responder' THEN
      v_role := 'responder'::public.user_role;
    ELSIF v_raw_role = 'volunteer' THEN
      v_role := 'volunteer'::public.user_role;
    ELSE
      v_role := 'citizen'::public.user_role;
    END IF;

    -- Bootstrap admin privileges for primary owner
    IF lower(COALESCE(new.email, '')) = 'sameh.saad.cg@gmail.com' THEN
      v_is_admin := TRUE;
    END IF;

    INSERT INTO public.profiles (
      id,
      role,
      is_admin,
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
      v_is_admin,
      COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
      CASE WHEN new.phone_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
      COALESCE(new.email, new.raw_user_meta_data->>'email'),
      CASE WHEN new.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
      COALESCE(
        NULLIF(new.raw_user_meta_data->>'full_name', ''),
        NULLIF(new.raw_user_meta_data->>'name', ''),
        NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
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
      is_admin = CASE WHEN v_is_admin THEN TRUE ELSE public.profiles.is_admin END,
      phone_verified = CASE WHEN EXCLUDED.phone_verified THEN TRUE ELSE public.profiles.phone_verified END,
      email_verified = CASE WHEN EXCLUDED.email_verified THEN TRUE ELSE public.profiles.email_verified END,
      updated_at = NOW();

    -- Ensure admin_users entry if owner
    IF v_is_admin THEN
      INSERT INTO public.admin_users (user_id, role_title)
      VALUES (new.id, 'مدير المنصة العام')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Ensure responder_profiles row exists for Associations and Responders
    IF v_role = 'responder' OR new.raw_user_meta_data->>'intended_usage' IN ('association', 'veterinarian') OR new.raw_user_meta_data->>'account_type' IN ('association', 'veterinarian') THEN
      INSERT INTO public.responder_profiles (
        user_id,
        responder_type,
        verification_status,
        name,
        title,
        description,
        responsible_contact_person,
        email,
        phone,
        governorates_served,
        cities_served,
        services_offered,
        registration_number,
        clinic_name,
        clinic_address,
        specialty,
        availability
      ) VALUES (
        new.id,
        CASE WHEN new.raw_user_meta_data->>'responder_type' = 'veterinarian' OR new.raw_user_meta_data->>'intended_usage' = 'veterinarian' THEN 'veterinarian'::public.responder_type ELSE 'association'::public.responder_type END,
        CASE WHEN new.raw_user_meta_data->>'responder_type' = 'veterinarian' OR new.raw_user_meta_data->>'intended_usage' = 'veterinarian' THEN 'pending'::public.verification_status ELSE 'verified'::public.verification_status END,
        COALESCE(NULLIF(new.raw_user_meta_data->>'org_name', ''), NULLIF(new.raw_user_meta_data->>'clinic_name', ''), NULLIF(new.raw_user_meta_data->>'full_name', ''), 'جمعية حماية الحيوان'),
        COALESCE(NULLIF(new.raw_user_meta_data->>'specialty', ''), CASE WHEN new.raw_user_meta_data->>'responder_type' = 'veterinarian' THEN 'طبيب بيطري' ELSE 'جمعية حماية الحيوان' END),
        'جهة معتمدة عبر المنصة الوطنية لحماية الحيوان',
        COALESCE(NULLIF(new.raw_user_meta_data->>'contact_person', ''), NULLIF(new.raw_user_meta_data->>'full_name', ''), ''),
        COALESCE(new.email, new.raw_user_meta_data->>'email', 'contact@hema.sy'),
        COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
        ARRAY[COALESCE(NULLIF(new.raw_user_meta_data->>'governorate', ''), 'damascus')],
        ARRAY[COALESCE(NULLIF(new.raw_user_meta_data->>'city', ''), 'دمشق')],
        ARRAY['rescue', 'veterinary_care', 'shelter'],
        COALESCE(new.raw_user_meta_data->>'registration_number', ''),
        new.raw_user_meta_data->>'clinic_name',
        new.raw_user_meta_data->>'clinic_address',
        new.raw_user_meta_data->>'specialty',
        'available'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = COALESCE(NULLIF(EXCLUDED.name, ''), public.responder_profiles.name),
        registration_number = COALESCE(NULLIF(EXCLUDED.registration_number, ''), public.responder_profiles.registration_number),
        updated_at = NOW();
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user encountered error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 19. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 20. GRANULAR RLS POLICIES

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ADMIN USERS
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));

-- RESPONDER PROFILES
DROP POLICY IF EXISTS "Responders view policy" ON public.responder_profiles;
CREATE POLICY "Responders view policy" ON public.responder_profiles FOR SELECT USING (
  verification_status = 'verified'::public.verification_status 
  OR user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Responders can update own profile data" ON public.responder_profiles;
CREATE POLICY "Responders can update own profile data" ON public.responder_profiles FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Responders can insert own profile" ON public.responder_profiles;
CREATE POLICY "Responders can insert own profile" ON public.responder_profiles FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- RESPONDER DOCUMENTS (Private credentials)
DROP POLICY IF EXISTS "Responder documents select policy" ON public.responder_documents;
CREATE POLICY "Responder documents select policy" ON public.responder_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Responder documents insert policy" ON public.responder_documents;
CREATE POLICY "Responder documents insert policy" ON public.responder_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

-- VOLUNTEER PROFILES (Volunteer locations and info protected from general public)
DROP POLICY IF EXISTS "Volunteer profiles view policy" ON public.volunteer_profiles;
CREATE POLICY "Volunteer profiles view policy" ON public.volunteer_profiles FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Volunteers update own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers update own profile" ON public.volunteer_profiles FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Volunteers insert own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers insert own profile" ON public.volunteer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- ADOPTION LISTINGS (Fixes the persistence & cross-browser bug)
DROP POLICY IF EXISTS "Published adoptions visible to all" ON public.adoption_listings;
CREATE POLICY "Published adoptions visible to all" ON public.adoption_listings FOR SELECT USING (
  status = 'published'::public.adoption_status 
  OR publisher_id = auth.uid()
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can create adoption listings" ON public.adoption_listings;
CREATE POLICY "Users can create adoption listings" ON public.adoption_listings FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = publisher_id
);

DROP POLICY IF EXISTS "Publishers can update own listings" ON public.adoption_listings;
CREATE POLICY "Publishers can update own listings" ON public.adoption_listings FOR UPDATE USING (
  auth.uid() = publisher_id OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Publishers can delete own listings" ON public.adoption_listings;
CREATE POLICY "Publishers can delete own listings" ON public.adoption_listings FOR DELETE USING (
  auth.uid() = publisher_id OR public.is_admin(auth.uid())
);

-- ADOPTION APPLICATIONS
DROP POLICY IF EXISTS "Applicant and publisher can view application" ON public.adoption_applications;
CREATE POLICY "Applicant and publisher can view application" ON public.adoption_applications FOR SELECT USING (
  applicant_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.adoption_listings al WHERE al.id = listing_id AND al.publisher_id = auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Citizens can apply for adoption" ON public.adoption_applications;
CREATE POLICY "Citizens can apply for adoption" ON public.adoption_applications FOR INSERT WITH CHECK (
  auth.uid() = applicant_id
);

DROP POLICY IF EXISTS "Publishers can update applications" ON public.adoption_applications;
CREATE POLICY "Publishers can update applications" ON public.adoption_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.adoption_listings al WHERE al.id = listing_id AND al.publisher_id = auth.uid())
  OR public.is_admin(auth.uid())
);

-- REPORTS (National Emergency Reports)
DROP POLICY IF EXISTS "Reports visibility policy" ON public.reports;
CREATE POLICY "Reports visibility policy" ON public.reports FOR SELECT USING (
  reporter_id = auth.uid()
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Citizens can insert reports" ON public.reports;
CREATE POLICY "Citizens can insert reports" ON public.reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND reporter_id = auth.uid()
);

DROP POLICY IF EXISTS "Responders and reporters can update reports" ON public.reports;
CREATE POLICY "Responders and reporters can update reports" ON public.reports FOR UPDATE USING (
  reporter_id = auth.uid() 
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

-- REPORT PRIVATE DETAILS (Reporter Phone & Micro-Location)
DROP POLICY IF EXISTS "Private details access" ON public.report_private_details;
CREATE POLICY "Private details access" ON public.report_private_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Reporter can insert private details" ON public.report_private_details;
CREATE POLICY "Reporter can insert private details" ON public.report_private_details FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
);

-- VOLUNTEER DISPATCHES
DROP POLICY IF EXISTS "Dispatches view policy" ON public.volunteer_dispatches;
CREATE POLICY "Dispatches view policy" ON public.volunteer_dispatches FOR SELECT USING (
  sender_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.volunteer_profiles vp 
    WHERE vp.id = volunteer_id AND vp.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Responders create dispatches" ON public.volunteer_dispatches;
CREATE POLICY "Responders create dispatches" ON public.volunteer_dispatches FOR INSERT WITH CHECK (
  public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Volunteers update dispatch status" ON public.volunteer_dispatches;
CREATE POLICY "Volunteers update dispatch status" ON public.volunteer_dispatches FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_profiles vp 
    WHERE vp.id = volunteer_id AND vp.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "System and authenticated users insert notifications" ON public.notifications;
CREATE POLICY "System and authenticated users insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 21. PRIVATE STORAGE BUCKET FOR VERIFICATION DOCUMENTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'verification_documents',
      'verification_documents',
      false,
      10485760,
      ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET public = false;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "Applicants can upload own verification documents" ON storage.objects;
    CREATE POLICY "Applicants can upload own verification documents"
    ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'verification_documents'
      AND auth.uid() IS NOT NULL
    );

    DROP POLICY IF EXISTS "Applicants and admins can read verification documents" ON storage.objects;
    CREATE POLICY "Applicants and admins can read verification documents"
    ON storage.objects FOR SELECT USING (
      bucket_id = 'verification_documents'
      AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR public.is_admin(auth.uid())
      )
    );
  END IF;
END $$;

-- 22. GRANT PRIVILEGES TO RELEVANT ROLES
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
