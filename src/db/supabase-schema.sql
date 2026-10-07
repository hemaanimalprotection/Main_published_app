-- ====================================================================
-- Hema (حِمى) - Animal Protection, Rescue & Adoption in Syria
-- Canonical Supabase Database Schema for Clean Installation
-- ====================================================================
-- Strictly ordered by dependency:
--   1. Extensions
--   2. Custom ENUM types & type permissions
--   3. Independent / Base tables
--   4. Dependent tables
--   5. Deferred foreign key constraints
--   6. Performance & integrity indexes
--   7. Helper & security functions
--   8. Row Level Security (RLS) enablement & table permissions
--   9. RLS policies
--  10. Application RPC functions
--  11. Triggers
--  12. Auth integration & auth.users trigger (LAST)
-- ====================================================================

-- ====================================================================
-- 1. EXTENSIONS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
  END IF;
END $$;

-- ====================================================================
-- 2. CUSTOM ENUM TYPES & PERMISSIONS
-- ====================================================================
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

-- Explicitly grant usage on each type (Valid standard PostgreSQL syntax)
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON TYPE public.user_role TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.responder_type TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.verification_status TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.animal_type TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.problem_category TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.severity_level TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.report_status TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.adoption_status TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.application_status TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.collaboration_role TO supabase_auth_admin;
    GRANT USAGE ON TYPE public.collaboration_status TO supabase_auth_admin;
  END IF;
END $$;

-- ====================================================================
-- 3. INDEPENDENT / BASE TABLES
-- ====================================================================

-- 3.1 PROFILES TABLE
-- Directly maps to Supabase auth.users. Supports email and phone users across all roles.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'citizen'::public.user_role,
  phone VARCHAR(30),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(255),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  full_name VARCHAR(150) NOT NULL,
  governorate VARCHAR(50) NOT NULL DEFAULT 'damascus',
  city VARCHAR(100) NOT NULL DEFAULT 'دمشق',
  neighborhood VARCHAR(150),
  avatar_url TEXT,
  volunteer_profile_id UUID,
  language_preference VARCHAR(5) NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 PHONE VERIFICATION OTP TABLE
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(30) NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 RESPONDER PROFILES TABLE (Associations & Licensed Veterinarians)
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
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 RESPONDER SUPPORTING DOCUMENTS
CREATE TABLE IF NOT EXISTS public.responder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responder_id UUID NOT NULL REFERENCES public.responder_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 VOLUNTEER PROFILES TABLE (Field Volunteers Network)
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

-- ====================================================================
-- 4. DEPENDENT TABLES
-- Strictly ordered: reports is created before any dependent tables
-- ====================================================================

-- 4.1 ANIMAL REPORTS TABLE
-- Created before any table referencing public.reports!
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

-- 4.2 VOLUNTEER DISPATCHES TABLE (References public.reports and public.volunteer_profiles)
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

-- 4.3 REPORT PRIVATE DETAILS (Restricted contact & precise coordinates)
CREATE TABLE IF NOT EXISTS public.report_private_details (
  report_id UUID PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  reporter_phone VARCHAR(30) NOT NULL,
  reporter_address TEXT,
  exact_lat NUMERIC(9, 6) NOT NULL,
  exact_lng NUMERIC(9, 6) NOT NULL,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 REPORT MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 REPORT RESPONSIBILITIES (Atomic active lead assignment history)
CREATE TABLE IF NOT EXISTS public.report_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.responder_profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  relinquished_at TIMESTAMPTZ,
  relinquish_reason TEXT
);

-- 4.6 REPORT COLLABORATORS TABLE
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

-- 4.7 REPORT STATUS HISTORY TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  previous_status public.report_status,
  new_status public.report_status NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8 REPORT UPDATES TABLE (Public bulletin updates & progress)
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

-- 4.9 REPORT PRIVATE NOTES TABLE (Internal medical & rescue notes)
CREATE TABLE IF NOT EXISTS public.report_private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.10 ADOPTION LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.adoption_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  animal_type public.animal_type NOT NULL,
  breed VARCHAR(100),
  sex VARCHAR(20) NOT NULL,
  age_group VARCHAR(20) NOT NULL,
  estimated_age VARCHAR(50) NOT NULL,
  size VARCHAR(20) NOT NULL,
  health_condition TEXT NOT NULL,
  is_vaccinated BOOLEAN NOT NULL DEFAULT FALSE,
  is_neutered BOOLEAN NOT NULL DEFAULT FALSE,
  special_needs TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  personality TEXT[] DEFAULT '{}',
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
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 ADOPTION APPLICATIONS TABLE
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

-- 4.12 NOTIFICATIONS TABLE
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

-- 4.13 AUDIT LOGS TABLE
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

-- ====================================================================
-- 5. DEFERRED FOREIGN KEYS / CONSTRAINTS
-- ====================================================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_volunteer_profile,
  ADD CONSTRAINT fk_profiles_volunteer_profile
  FOREIGN KEY (volunteer_profile_id) REFERENCES public.volunteer_profiles(id) ON DELETE SET NULL;

-- ====================================================================
-- 6. INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_responder_profiles_user ON public.responder_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_responder_profiles_status ON public.responder_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_responder_documents_responder ON public.responder_documents(responder_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_governorate ON public.volunteer_profiles(governorate);
CREATE INDEX IF NOT EXISTS idx_volunteer_status ON public.volunteer_profiles(verification_status);

CREATE INDEX IF NOT EXISTS idx_reports_governorate ON public.reports(governorate);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_lead_responder ON public.reports(lead_responder_id);

CREATE INDEX IF NOT EXISTS idx_dispatches_volunteer ON public.volunteer_dispatches(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_report ON public.volunteer_dispatches(report_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON public.volunteer_dispatches(status);

CREATE INDEX IF NOT EXISTS idx_report_media_report ON public.report_media(report_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_lead_responder ON public.report_responsibilities (report_id) WHERE (is_active = TRUE);
CREATE INDEX IF NOT EXISTS idx_report_collab_report ON public.report_collaborators(report_id);
CREATE INDEX IF NOT EXISTS idx_report_collab_responder ON public.report_collaborators(responder_id);
CREATE INDEX IF NOT EXISTS idx_report_history_report ON public.report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_updates_report ON public.report_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_report_notes_report ON public.report_private_notes(report_id);

CREATE INDEX IF NOT EXISTS idx_adoption_governorate ON public.adoption_listings(governorate);
CREATE INDEX IF NOT EXISTS idx_adoption_status ON public.adoption_listings(status);
CREATE INDEX IF NOT EXISTS idx_adoption_type ON public.adoption_listings(animal_type);
CREATE INDEX IF NOT EXISTS idx_adoption_app_listing ON public.adoption_applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_adoption_app_applicant ON public.adoption_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- ====================================================================
-- 7. HELPER & SECURITY FUNCTIONS
-- Must precede RLS policies that evaluate them
-- ====================================================================

-- 7.1 Check if user is an approved responder
CREATE OR REPLACE FUNCTION public.is_approved_responder(uid UUID) 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.responder_profiles rp
    JOIN public.profiles p ON p.id = rp.user_id
    WHERE rp.user_id = uid AND rp.verification_status = 'verified'::public.verification_status
  );
$$;

-- 7.2 Check if user is lead responder on a specific report
CREATE OR REPLACE FUNCTION public.is_lead_responder(p_report_id UUID, uid UUID) 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.responder_profiles rp ON rp.id = r.lead_responder_id
    WHERE r.id = p_report_id AND rp.user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_approved_responder(UUID) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_lead_responder(UUID, UUID) TO postgres, anon, authenticated, service_role;

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) ENABLEMENT & TABLE GRANTS
-- ====================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 9. RLS POLICIES
-- ====================================================================

-- 9.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 9.2 PHONE VERIFICATIONS POLICIES
DROP POLICY IF EXISTS "Phone verification select policy" ON public.phone_verifications;
CREATE POLICY "Phone verification select policy" 
ON public.phone_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Phone verification insert policy" ON public.phone_verifications;
CREATE POLICY "Phone verification insert policy" 
ON public.phone_verifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Phone verification update policy" ON public.phone_verifications;
CREATE POLICY "Phone verification update policy" 
ON public.phone_verifications FOR UPDATE USING (true);

-- 9.3 RESPONDER PROFILES POLICIES
DROP POLICY IF EXISTS "Approved responders visible to all" ON public.responder_profiles;
CREATE POLICY "Approved responders visible to all" 
ON public.responder_profiles FOR SELECT USING (
  verification_status = 'verified'::public.verification_status 
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Responders can update own profile data" ON public.responder_profiles;
CREATE POLICY "Responders can update own profile data" 
ON public.responder_profiles FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Responders can insert own profile" ON public.responder_profiles;
CREATE POLICY "Responders can insert own profile" 
ON public.responder_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9.4 RESPONDER DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Responder documents select policy" ON public.responder_documents;
CREATE POLICY "Responder documents select policy" 
ON public.responder_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
  OR public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Responder documents insert policy" ON public.responder_documents;
CREATE POLICY "Responder documents insert policy" 
ON public.responder_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Responder documents delete policy" ON public.responder_documents;
CREATE POLICY "Responder documents delete policy" 
ON public.responder_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
);

-- 9.5 VOLUNTEER PROFILES POLICIES
DROP POLICY IF EXISTS "Volunteer profiles view policy" ON public.volunteer_profiles;
CREATE POLICY "Volunteer profiles view policy" 
ON public.volunteer_profiles FOR SELECT USING (
  user_id = auth.uid() 
  OR verification_status = 'active'
);

DROP POLICY IF EXISTS "Volunteers update own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers update own profile" 
ON public.volunteer_profiles FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Volunteers insert own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers insert own profile" 
ON public.volunteer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9.6 VOLUNTEER DISPATCHES POLICIES
DROP POLICY IF EXISTS "Dispatches view policy" ON public.volunteer_dispatches;
CREATE POLICY "Dispatches view policy" 
ON public.volunteer_dispatches FOR SELECT USING (
  sender_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.volunteer_profiles vp 
    WHERE vp.id = volunteer_id AND vp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Responders create dispatches" ON public.volunteer_dispatches;
CREATE POLICY "Responders create dispatches" 
ON public.volunteer_dispatches FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

DROP POLICY IF EXISTS "Volunteers update dispatch status" ON public.volunteer_dispatches;
CREATE POLICY "Volunteers update dispatch status" 
ON public.volunteer_dispatches FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_profiles vp 
    WHERE vp.id = volunteer_id AND vp.user_id = auth.uid()
  )
);

-- 9.7 REPORTS POLICIES
-- Public emergency animal feed is readable by all (approximate GPS & general details)
DROP POLICY IF EXISTS "Reports visibility policy" ON public.reports;
CREATE POLICY "Reports visibility policy" 
ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Citizens can insert reports" ON public.reports;
CREATE POLICY "Citizens can insert reports" 
ON public.reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND reporter_id = auth.uid()
);

DROP POLICY IF EXISTS "Responders and reporters can update reports" ON public.reports;
CREATE POLICY "Responders and reporters can update reports" 
ON public.reports FOR UPDATE USING (
  reporter_id = auth.uid() OR public.is_approved_responder(auth.uid())
);

-- 9.8 REPORT PRIVATE DETAILS POLICIES (Guaranteed Privacy)
-- Only reporter OR assigned lead responder OR approved collaborators can view private details
DROP POLICY IF EXISTS "Private details access" ON public.report_private_details;
CREATE POLICY "Private details access" 
ON public.report_private_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_lead_responder(report_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.report_collaborators rc
    JOIN public.responder_profiles rp ON rp.id = rc.responder_id
    WHERE rc.report_id = report_id AND rp.user_id = auth.uid() AND rc.status = 'accepted'::public.collaboration_status
  )
);

DROP POLICY IF EXISTS "Reporter can insert private details" ON public.report_private_details;
CREATE POLICY "Reporter can insert private details" 
ON public.report_private_details FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
);

-- 9.9 REPORT MEDIA POLICIES
DROP POLICY IF EXISTS "Report media viewable by all" ON public.report_media;
CREATE POLICY "Report media viewable by all" 
ON public.report_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized users can insert report media" ON public.report_media;
CREATE POLICY "Authorized users can insert report media" 
ON public.report_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_approved_responder(auth.uid())
);

-- 9.10 REPORT RESPONSIBILITIES POLICIES
DROP POLICY IF EXISTS "Report responsibilities viewable by all" ON public.report_responsibilities;
CREATE POLICY "Report responsibilities viewable by all" 
ON public.report_responsibilities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Responders insert responsibility" ON public.report_responsibilities;
CREATE POLICY "Responders insert responsibility" 
ON public.report_responsibilities FOR INSERT WITH CHECK (
  public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Responders update responsibility" ON public.report_responsibilities;
CREATE POLICY "Responders update responsibility" 
ON public.report_responsibilities FOR UPDATE USING (
  public.is_approved_responder(auth.uid())
);

-- 9.11 REPORT COLLABORATORS POLICIES
DROP POLICY IF EXISTS "Report collaborators viewable by all" ON public.report_collaborators;
CREATE POLICY "Report collaborators viewable by all" 
ON public.report_collaborators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Responders manage collaborators" ON public.report_collaborators;
CREATE POLICY "Responders manage collaborators" 
ON public.report_collaborators FOR INSERT WITH CHECK (
  public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Collaborators update status" ON public.report_collaborators;
CREATE POLICY "Collaborators update status" 
ON public.report_collaborators FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
  OR public.is_approved_responder(auth.uid())
);

-- 9.12 REPORT STATUS HISTORY POLICIES
DROP POLICY IF EXISTS "Status history viewable by all" ON public.report_status_history;
CREATE POLICY "Status history viewable by all" 
ON public.report_status_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert status history" ON public.report_status_history;
CREATE POLICY "Authenticated users insert status history" 
ON public.report_status_history FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 9.13 REPORT UPDATES POLICIES
DROP POLICY IF EXISTS "Public updates viewable by all" ON public.report_updates;
CREATE POLICY "Public updates viewable by all" 
ON public.report_updates FOR SELECT USING (
  is_public = TRUE OR public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Responders create report updates" ON public.report_updates;
CREATE POLICY "Responders create report updates" 
ON public.report_updates FOR INSERT WITH CHECK (
  public.is_approved_responder(auth.uid())
);

-- 9.14 REPORT PRIVATE NOTES POLICIES
DROP POLICY IF EXISTS "Private notes viewable by authorized responders" ON public.report_private_notes;
CREATE POLICY "Private notes viewable by authorized responders" 
ON public.report_private_notes FOR SELECT USING (
  public.is_lead_responder(report_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.report_collaborators rc
    JOIN public.responder_profiles rp ON rp.id = rc.responder_id
    WHERE rc.report_id = report_id AND rp.user_id = auth.uid() AND rc.status = 'accepted'::public.collaboration_status
  )
);

DROP POLICY IF EXISTS "Private notes insertable by authorized responders" ON public.report_private_notes;
CREATE POLICY "Private notes insertable by authorized responders" 
ON public.report_private_notes FOR INSERT WITH CHECK (
  public.is_lead_responder(report_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.report_collaborators rc
    JOIN public.responder_profiles rp ON rp.id = rc.responder_id
    WHERE rc.report_id = report_id AND rp.user_id = auth.uid() AND rc.status = 'accepted'::public.collaboration_status
  )
);

-- 9.15 ADOPTION LISTINGS POLICIES
DROP POLICY IF EXISTS "Published adoptions visible to all" ON public.adoption_listings;
CREATE POLICY "Published adoptions visible to all" 
ON public.adoption_listings FOR SELECT USING (
  status = 'published'::public.adoption_status 
  OR publisher_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can create adoption listings" ON public.adoption_listings;
CREATE POLICY "Users can create adoption listings" 
ON public.adoption_listings FOR INSERT WITH CHECK (auth.uid() = publisher_id);

DROP POLICY IF EXISTS "Publishers can update own listings" ON public.adoption_listings;
CREATE POLICY "Publishers can update own listings" 
ON public.adoption_listings FOR UPDATE USING (auth.uid() = publisher_id);

-- 9.16 ADOPTION APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Applicant and publisher can view application" ON public.adoption_applications;
CREATE POLICY "Applicant and publisher can view application" 
ON public.adoption_applications FOR SELECT USING (
  applicant_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.adoption_listings al WHERE al.id = listing_id AND al.publisher_id = auth.uid())
);

DROP POLICY IF EXISTS "Citizens can apply for adoption" ON public.adoption_applications;
CREATE POLICY "Citizens can apply for adoption" 
ON public.adoption_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Publishers can update applications" ON public.adoption_applications;
CREATE POLICY "Publishers can update applications" 
ON public.adoption_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.adoption_listings al WHERE al.id = listing_id AND al.publisher_id = auth.uid())
);

-- 9.17 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" 
ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" 
ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- 9.18 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view relevant audit logs" 
ON public.audit_logs FOR SELECT USING (
  actor_id = auth.uid() OR public.is_approved_responder(auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users create audit logs" 
ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================================================
-- 10. APPLICATION RPC FUNCTIONS
-- ====================================================================

-- 10.1 ATOMIC LEAD ACCEPTANCE FUNCTION
CREATE OR REPLACE FUNCTION public.accept_report_responsibility(
  p_report_id UUID,
  p_initial_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_responder public.responder_profiles%ROWTYPE;
  v_report public.reports%ROWTYPE;
  v_resp_id UUID;
BEGIN
  -- 1. Check if user is an approved responder
  SELECT * INTO v_responder 
  FROM public.responder_profiles 
  WHERE user_id = v_user_id AND verification_status = 'verified'::public.verification_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Access Denied: Only approved associations and veterinarians can accept reports.';
  END IF;

  -- 2. Lock report row and verify it is not already assigned
  SELECT * INTO v_report 
  FROM public.reports 
  WHERE id = p_report_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.';
  END IF;

  IF v_report.is_assigned AND v_report.lead_responder_id IS NOT NULL THEN
    RAISE EXCEPTION 'This report is already assigned to another responder.';
  END IF;

  -- 3. Insert Lead Responsibility Record
  INSERT INTO public.report_responsibilities (report_id, responder_id, is_active, accepted_at)
  VALUES (p_report_id, v_responder.id, TRUE, NOW())
  RETURNING id INTO v_resp_id;

  -- 4. Update Report status
  UPDATE public.reports
  SET 
    is_assigned = TRUE,
    lead_responder_id = v_responder.id,
    lead_accepted_at = NOW(),
    status = 'responsibility_accepted'::public.report_status,
    updated_at = NOW()
  WHERE id = p_report_id;

  -- 5. Insert Status History Audit
  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, actor_id, explanation
  ) VALUES (
    p_report_id, v_report.status, 'responsibility_accepted'::public.report_status, v_user_id,
    COALESCE(p_initial_notes, 'Accepted case responsibility.')
  );

  -- 6. Insert notification for citizen
  INSERT INTO public.notifications (
    user_id, type, title_ar, title_fr, body_ar, body_fr, related_report_id
  ) VALUES (
    v_report.reporter_id,
    'responsibility_accepted',
    'تم قبول بلاغك وبدء التدخل',
    'Prise en charge de votre signalement',
    'قامت ' || v_responder.name || ' بقبول مسؤولية البلاغ رقم ' || v_report.reference_number || ' وبدء الاستجابة الميدانية.',
    v_responder.name || ' a pris en charge le signalement ' || v_report.reference_number || '.',
    p_report_id
  );

  -- 7. Log audit event
  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_user_id,
    'ACCEPT_RESPONSIBILITY',
    'report',
    p_report_id,
    jsonb_build_object('responder_id', v_responder.id, 'responder_name', v_responder.name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'status', 'responsibility_accepted',
    'lead_responder_name', v_responder.name
  );
END;
$$;

-- 10.2 UPDATE REPORT STATUS WITH PUBLIC BULLETIN UPDATE
CREATE OR REPLACE FUNCTION public.update_report_status(
  p_report_id UUID,
  p_new_status public.report_status,
  p_explanation TEXT,
  p_is_public BOOLEAN DEFAULT TRUE,
  p_media_urls TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_report public.reports%ROWTYPE;
  v_responder public.responder_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.';
  END IF;

  SELECT * INTO v_responder FROM public.responder_profiles WHERE user_id = v_user_id;

  -- Verify responder is lead or collaborator
  IF NOT (v_report.lead_responder_id = v_responder.id OR public.is_approved_responder(v_user_id)) THEN
    RAISE EXCEPTION 'Unauthorized to update this case.';
  END IF;

  -- Update report
  UPDATE public.reports 
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_report_id;

  -- History
  INSERT INTO public.report_status_history (
    report_id, previous_status, new_status, actor_id, explanation
  ) VALUES (
    p_report_id, v_report.status, p_new_status, v_user_id, p_explanation
  );

  -- Optional Update Bulletin
  IF p_explanation IS NOT NULL AND length(p_explanation) > 0 THEN
    INSERT INTO public.report_updates (
      report_id, author_id, title, content, media_urls, is_public
    ) VALUES (
      p_report_id, v_user_id, 'تحديث الحالة: ' || p_new_status::text,
      p_explanation, p_media_urls, p_is_public
    );
  END IF;

  -- Notify citizen
  INSERT INTO public.notifications (
    user_id, type, title_ar, title_fr, body_ar, body_fr, related_report_id
  ) VALUES (
    v_report.reporter_id,
    'report_status_updated',
    'تحديث على حالة بلاغك',
    'Mise à jour du statut de votre signalement',
    'تم تحديث حالة البلاغ ' || v_report.reference_number || ' إلى: ' || p_new_status::text,
    'Le statut de votre signalement ' || v_report.reference_number || ' est passé à: ' || p_new_status::text,
    p_report_id
  );

  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_report_responsibility(UUID, TEXT) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_report_status(UUID, public.report_status, TEXT, BOOLEAN, TEXT[]) TO postgres, anon, authenticated, service_role;

-- ====================================================================
-- 11. TRIGGERS
-- ====================================================================

-- ====================================================================
-- 12. AUTH INTEGRATION (Created LAST after all public dependencies exist)
-- ====================================================================

-- Trigger function runs on auth.users AFTER INSERT.
-- Explicit SET search_path = public, pg_temp prevents "type user_role does not exist"
-- in Supabase Auth GoTrue sessions.
-- Wrapped in an exception block to ensure user signup/invite in auth.users NEVER fails.
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
    
    -- Map role safely; defaults to citizen
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ====================================================================
-- END OF CANONICAL SCHEMA
-- ====================================================================
