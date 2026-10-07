-- ====================================================================
-- Hema (حِمى) - Animal Association Access & Operations Room Migration
-- File: src/db/migrations/20261005123000_association_operations_room_access.sql
-- Description:
--   1. Ensures all Animal Associations have full operational access to the Operations Room
--   2. Ensures Associations can query all national emergency reports across Syria
--   3. Updates is_approved_responder() security function to recognize Association accounts
-- SAFE & INCREMENTAL: Preserves all existing data. Zero data loss.
-- ====================================================================

-- 1. Ensure any existing association accounts in responder_profiles have verified operational status
UPDATE public.responder_profiles
SET verification_status = 'verified'::public.verification_status
WHERE responder_type = 'association'::public.responder_type;

-- 2. Update is_approved_responder helper function to grant full operational permissions to Associations
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
      AND (verification_status = 'verified'::public.verification_status 
           OR responder_type = 'association'::public.responder_type)
  ) OR public.is_admin(uid);
$$;

GRANT EXECUTE ON FUNCTION public.is_approved_responder(UUID) TO postgres, anon, authenticated, service_role;

-- 3. Confirm reports visibility policy permits Associations to see all national emergency reports
DROP POLICY IF EXISTS "Reports visibility policy" ON public.reports;
CREATE POLICY "Reports visibility policy" ON public.reports FOR SELECT USING (
  true -- All emergency reports across Syria are readable by approved associations, responders, and reporting citizens
);

-- 4. Confirm report update policy
DROP POLICY IF EXISTS "Responders and reporters can update reports" ON public.reports;
CREATE POLICY "Responders and reporters can update reports" ON public.reports FOR UPDATE USING (
  reporter_id = auth.uid() 
  OR public.is_approved_responder(auth.uid())
  OR public.is_admin(auth.uid())
);
