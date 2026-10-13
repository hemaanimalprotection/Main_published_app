-- ====================================================================
-- Hema (حِمى) - Final Production Architecture & Authorization Migration
-- File: src/db/migrations/20261005040000_hima_final_production_architecture.sql
-- Description:
--   1. Implements Citizen + Volunteer capability model (is_volunteer column).
--   2. Establishes trusted Admin authorization & audit review structures.
--   3. Hardens professional verification (Association & Veterinarian review states).
--   4. Creates private Storage bucket & RLS policies for verification documents.
--   5. Hardens Row Level Security (RLS) across public, citizen, volunteer, professional, and admin roles.
--   6. Safe incremental migration for existing production database (Zero data loss, preserves all existing tables and rows).
-- ====================================================================

-- 1. ADD COLUMNS SAFELY TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill volunteer capabilities from existing volunteer rows or roles
UPDATE public.profiles
SET is_volunteer = TRUE
WHERE role = 'volunteer' OR volunteer_profile_id IS NOT NULL;

-- Backfill initial administrator authorization for platform administrator email
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'sameh.saad.cg@gmail.com';

-- 2. ADD COLUMNS SAFELY TO RESPONDER PROFILES TABLE
ALTER TABLE public.responder_profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS supporting_document_urls TEXT[] DEFAULT '{}';

-- 3. ENSURE CUSTOM DOMAIN ENUMS EXIST AND GRANT USAGE INDIVIDUALLY
-- Standard valid PostgreSQL syntax (never use invalid "GRANT ON ALL TYPES")
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. TRUSTED ADMIN CHECK FUNCTION (STABLE, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- 5. PREVENT SELF-ADMIN PRIVILEGE ESCALATION TRIGGER
-- Normal users must NEVER be able to set is_admin = true on their own profile
CREATE OR REPLACE FUNCTION public.prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized: Administrator privileges can only be modified by authorized administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_admin ON public.profiles;
CREATE TRIGGER trg_prevent_self_admin
BEFORE UPDATE OF is_admin ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_escalation();

-- 6. TRUSTED PROFESSIONAL ROLE CHECK FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_approved_responder(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT COALESCE(
    (SELECT TRUE FROM public.responder_profiles 
     WHERE user_id = is_approved_responder.user_id 
       AND verification_status = 'verified'::public.verification_status 
     LIMIT 1),
    FALSE
  ) OR public.is_admin(user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_approved_association(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT COALESCE(
    (SELECT TRUE FROM public.responder_profiles 
     WHERE user_id = is_approved_association.user_id 
       AND responder_type = 'association'::public.responder_type
       AND verification_status = 'verified'::public.verification_status 
     LIMIT 1),
    FALSE
  ) OR public.is_admin(user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_approved_veterinarian(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT COALESCE(
    (SELECT TRUE FROM public.responder_profiles 
     WHERE user_id = is_approved_veterinarian.user_id 
       AND responder_type = 'veterinarian'::public.responder_type
       AND verification_status = 'verified'::public.verification_status 
     LIMIT 1),
    FALSE
  ) OR public.is_admin(user_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_approved_responder(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_association(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_veterinarian(UUID) TO anon, authenticated, service_role;

-- 7. ATOMIC ADMIN REVIEW RPC FUNCTION
CREATE OR REPLACE FUNCTION public.admin_review_responder(
  p_responder_id UUID,
  p_status public.verification_status,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller_id UUID;
  v_user_id UUID;
  v_responder_name TEXT;
  v_responder_type public.responder_type;
BEGIN
  v_caller_id := auth.uid();

  -- Verify administrative authorization
  IF NOT public.is_admin(v_caller_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin access required.');
  END IF;

  -- Fetch responder record
  SELECT user_id, name, responder_type 
  INTO v_user_id, v_responder_name, v_responder_type
  FROM public.responder_profiles
  WHERE id = p_responder_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Responder application not found.');
  END IF;

  -- Update verification status
  UPDATE public.responder_profiles
  SET 
    verification_status = p_status,
    verified_at = CASE WHEN p_status = 'verified' THEN NOW() ELSE verified_at END,
    verified_by = v_caller_id,
    rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_responder_id;

  -- Insert notification for the applicant user
  INSERT INTO public.notifications (
    user_id,
    type,
    title_ar,
    title_fr,
    body_ar,
    body_fr
  ) VALUES (
    v_user_id,
    CASE WHEN p_status = 'verified' THEN 'responder_verified' ELSE 'responder_rejected' END,
    CASE 
      WHEN p_status = 'verified' THEN '✅ تم اعتماد حسابكم المهني رسمياً في حِمى'
      ELSE '❌ تحديث بخصوص طلب الاعتماد المهني'
    END,
    CASE 
      WHEN p_status = 'verified' THEN 'Compte professionnel validé'
      ELSE 'Mise à jour concernant votre demande'
    END,
    CASE 
      WHEN p_status = 'verified' THEN 'تهانينا! تم تدقيق واعتماد حسابكم المهني بنجاح وتم تفعيل صلاحيات غرفة العمليات الوطنية.'
      ELSE 'نعتذر، لم يتم اعتماد الطلب: ' || COALESCE(p_rejection_reason, 'الوثائق غير مستوفية للشروط المطلوبة.')
    END,
    CASE 
      WHEN p_status = 'verified' THEN 'Votre compte a été vérifié avec succès.'
      ELSE 'Votre demande a été refusée.'
    END
  );

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_responder(UUID, public.verification_status, TEXT) TO authenticated, service_role;

-- 8. PRIVATE STORAGE BUCKET FOR VERIFICATION DOCUMENTS
-- Create bucket if not exists and ensure it is PRIVATE
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Storage RLS: Applicant can upload to {auth.uid()}/*
DROP POLICY IF EXISTS "Applicants upload own verification documents" ON storage.objects;
CREATE POLICY "Applicants upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: Applicant can view own, Admin can view all
DROP POLICY IF EXISTS "Applicants and admins view verification documents" ON storage.objects;
CREATE POLICY "Applicants and admins view verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin(auth.uid())
  )
);

-- 9. HARDEN TABLE ROW LEVEL SECURITY POLICIES

-- 9.1 ADOPTION LISTINGS: Genuinely public across browsers & guests
ALTER TABLE public.adoption_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published adoptions visible to all" ON public.adoption_listings;
CREATE POLICY "Published adoptions visible to all" 
ON public.adoption_listings FOR SELECT 
USING (
  status = 'published'::public.adoption_status 
  OR publisher_id = auth.uid()
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can create adoption listings" ON public.adoption_listings;
CREATE POLICY "Users can create adoption listings" 
ON public.adoption_listings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = publisher_id);

DROP POLICY IF EXISTS "Publishers and admins can update listings" ON public.adoption_listings;
CREATE POLICY "Publishers and admins can update listings" 
ON public.adoption_listings FOR UPDATE 
TO authenticated
USING (auth.uid() = publisher_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Publishers and admins can delete listings" ON public.adoption_listings;
CREATE POLICY "Publishers and admins can delete listings" 
ON public.adoption_listings FOR DELETE 
TO authenticated
USING (auth.uid() = publisher_id OR public.is_admin(auth.uid()));

-- 9.2 REPORTS & OPERATIONS ROOM
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reports visibility policy" ON public.reports;
CREATE POLICY "Reports visibility policy" 
ON public.reports FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Citizens can insert reports" ON public.reports;
CREATE POLICY "Citizens can insert reports" 
ON public.reports FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Responders and reporters can update reports" ON public.reports;
CREATE POLICY "Responders and reporters can update reports" 
ON public.reports FOR UPDATE 
TO authenticated
USING (
  reporter_id = auth.uid() 
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

-- 9.3 REPORT PRIVATE DETAILS (Only reporter, assigned lead, accepted collaborator, or admin)
ALTER TABLE public.report_private_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Private details access" ON public.report_private_details;
CREATE POLICY "Private details access" 
ON public.report_private_details FOR SELECT 
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_lead_responder(report_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.report_collaborators rc
    JOIN public.responder_profiles rp ON rp.id = rc.responder_id
    WHERE rc.report_id = report_id AND rp.user_id = auth.uid() AND rc.status = 'accepted'::public.collaboration_status
  )
);

DROP POLICY IF EXISTS "Reporter can insert private details" ON public.report_private_details;
CREATE POLICY "Reporter can insert private details" 
ON public.report_private_details FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_admin(auth.uid())
);

-- 9.4 VOLUNTEER PROFILES (Privacy Protected: Public cannot query volunteers directly)
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Volunteer profiles view policy" ON public.volunteer_profiles;
CREATE POLICY "Volunteer profiles view policy" 
ON public.volunteer_profiles FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Volunteers update own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers update own profile" 
ON public.volunteer_profiles FOR UPDATE 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Volunteers insert own profile" ON public.volunteer_profiles;
CREATE POLICY "Volunteers insert own profile" 
ON public.volunteer_profiles FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 9.5 RESPONDER PROFILES
ALTER TABLE public.responder_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Responder profiles view policy" ON public.responder_profiles;
CREATE POLICY "Responder profiles view policy" 
ON public.responder_profiles FOR SELECT 
USING (
  verification_status = 'verified'::public.verification_status
  OR user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Responders insert own profile" ON public.responder_profiles;
CREATE POLICY "Responders insert own profile" 
ON public.responder_profiles FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Responders update own profile" ON public.responder_profiles;
CREATE POLICY "Responders update own profile" 
ON public.responder_profiles FOR UPDATE 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 9.6 RESPONDER DOCUMENTS (Strictly private: only applicant and admin)
ALTER TABLE public.responder_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Responder documents view policy" ON public.responder_documents;
CREATE POLICY "Responder documents view policy" 
ON public.responder_documents FOR SELECT 
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Responder documents insert policy" ON public.responder_documents;
CREATE POLICY "Responder documents insert policy" 
ON public.responder_documents FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.responder_profiles rp WHERE rp.id = responder_id AND rp.user_id = auth.uid())
);

-- 10. REFRESH AUTH TRIGGER FOR COMPATIBILITY
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.user_role;
  v_raw_role TEXT;
  v_is_vol BOOLEAN;
BEGIN
  BEGIN
    v_raw_role := new.raw_user_meta_data->>'role';
    v_is_vol := COALESCE((new.raw_user_meta_data->>'is_volunteer')::BOOLEAN, FALSE);
    
    IF v_raw_role = 'responder' THEN
      v_role := 'responder'::public.user_role;
    ELSIF v_raw_role = 'volunteer' THEN
      v_role := 'volunteer'::public.user_role;
      v_is_vol := TRUE;
    ELSE
      v_role := 'citizen'::public.user_role;
    END IF;

    INSERT INTO public.profiles (
      id,
      role,
      is_volunteer,
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
      v_is_vol,
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
      full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      is_volunteer = CASE WHEN v_is_vol THEN TRUE ELSE public.profiles.is_volunteer END,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user caught error: %', SQLERRM;
  END;

  RETURN new;
END;
$$;
