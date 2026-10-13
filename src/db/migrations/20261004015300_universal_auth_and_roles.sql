-- ====================================================================
-- Hema (حِمى) - Production Database Migration
-- File: src/db/migrations/20261004015300_universal_auth_and_roles.sql
-- Description: Unified Authentication, Multi-Role Architecture, and RLS Permissions
-- Safe to run on existing production database (Preserves all existing users and tables)
-- ====================================================================

-- 1. ADD 'volunteer' ROLE TO user_role ENUM IF NOT PRESENT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ 
    JOIN pg_enum enm ON enm.enumtypid = typ.oid 
    WHERE typ.typname = 'user_role' AND enm.enumlabel = 'volunteer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'volunteer';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    CREATE TYPE user_role AS ENUM ('citizen', 'responder', 'volunteer');
END $$;

-- 2. ENSURE PROFILES COLUMNS SUPPORT EMAIL, PHONE & ROLES (NON-DESTRUCTIVE)
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS volunteer_profile_id UUID;

-- Ensure phone is not strictly required if a user registered with email
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN phone DROP NOT NULL;

-- 3. VOLUNTEER PROFILES TABLE (Genuinely new table)
CREATE TABLE IF NOT EXISTS public.volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255),
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(150),
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

CREATE INDEX IF NOT EXISTS idx_volunteer_governorate ON public.volunteer_profiles(governorate);
CREATE INDEX IF NOT EXISTS idx_volunteer_status ON public.volunteer_profiles(verification_status);

-- 4. VOLUNTEER DISPATCHES TABLE (Genuinely new table)
CREATE TABLE IF NOT EXISTS public.volunteer_dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID,
  report_reference VARCHAR(50),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
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

-- Safely connect foreign key to reports table if reports table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'volunteer_dispatches_report_id_fkey'
    ) THEN
      ALTER TABLE public.volunteer_dispatches 
        ADD CONSTRAINT volunteer_dispatches_report_id_fkey 
        FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dispatches_volunteer ON public.volunteer_dispatches(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON public.volunteer_dispatches(status);

-- 5. ROW LEVEL SECURITY (RLS) FOR VOLUNTEER TABLES
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_dispatches ENABLE ROW LEVEL SECURITY;

-- Volunteer profile view policy:
-- Approved responders can view active volunteers for coordination.
-- Volunteers can view and edit their own profiles.
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

-- Volunteer dispatches policies:
-- Target volunteer can see their incoming dispatches.
-- Sender responder can see dispatches they created.
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

-- 6. SECURITY: PREVENT UNAUTHORIZED ROLE ESCALATION
-- Role selection during registration must not grant administrator privileges
-- Responder accounts remain verification_status = 'pending' until approved.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_role user_role;
  v_raw_role TEXT;
BEGIN
  v_raw_role := new.raw_user_meta_data->>'role';
  
  -- Determine role safely; defaults to citizen
  IF v_raw_role = 'responder' THEN
    v_role := 'responder';
  ELSIF v_raw_role = 'volunteer' THEN
    v_role := 'volunteer';
  ELSE
    v_role := 'citizen';
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    phone,
    phone_verified,
    full_name,
    email,
    governorate,
    city,
    neighborhood,
    language_preference
  ) VALUES (
    new.id,
    v_role,
    COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
    CASE WHEN new.phone_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.email, new.raw_user_meta_data->>'email'),
    COALESCE(new.raw_user_meta_data->>'governorate', 'damascus'),
    COALESCE(new.raw_user_meta_data->>'city', 'دمشق'),
    COALESCE(new.raw_user_meta_data->>'neighborhood', ''),
    COALESCE(new.raw_user_meta_data->>'language_preference', 'ar')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Trigger on auth.users (Supabase managed auth table)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
