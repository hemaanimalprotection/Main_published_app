-- ====================================================================
-- HEMA (حِمى) - Animal Protection Platform in Syria
-- Public Beta Database Cleanup Script for Demonstration Records
-- ====================================================================
-- SCOPE & SAFETY NOTICE:
-- This script targets ONLY explicitly identified test/demo records created
-- during the pre-beta development and testing phases.
-- It strictly preserves all genuine user accounts, reports, applications, 
-- and responder profiles.
--
-- TARGETED IDENTIFIERS:
-- 1. Demo Reports:
--    'rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03'
--    Reference numbers starting with 'MAWA-2026-'
-- 2. Demo Adoption Listings:
--    'adopt_01', 'adopt_02', 'adopt_03', 'adopt_04', 'adopt_05', 'adopt_06'
-- 3. Demo Responder Profiles:
--    'resp_assoc_01', 'resp_vet_01', 'resp_assoc_02'
-- 4. Demo Volunteer Profiles:
--    'vol_01', 'vol_02', 'vol_03', 'vol_04'
-- 5. Demo Dispatches:
--    'disp_01', 'disp_02', 'disp_03'
-- 6. Demo Test Users:
--    'usr_citizen_01', 'usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04'
-- 7. Demo Notifications:
--    'notif_01', 'notif_02', 'notif_03'
-- ====================================================================

BEGIN;

-- 1. Delete associated child records for demo reports
DELETE FROM public.report_private_details 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

DELETE FROM public.report_media 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

DELETE FROM public.report_updates 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

DELETE FROM public.report_responsibilities 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR responder_id IN ('resp_assoc_01', 'resp_vet_01', 'resp_assoc_02')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

DELETE FROM public.report_collaborators 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR responder_id IN ('resp_assoc_01', 'resp_vet_01', 'resp_assoc_02')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

DELETE FROM public.report_status_history 
WHERE report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR report_id IN (SELECT id FROM public.reports WHERE reference_number LIKE 'MAWA-2026-%');

-- 2. Delete demo volunteer dispatches
DELETE FROM public.volunteer_dispatches 
WHERE id IN ('disp_01', 'disp_02', 'disp_03')
   OR volunteer_id IN ('vol_01', 'vol_02', 'vol_03', 'vol_04')
   OR report_id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03');

-- 3. Delete demo reports
DELETE FROM public.reports 
WHERE id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
   OR reference_number LIKE 'MAWA-2026-%';

-- 4. Delete demo adoption applications & listings
DELETE FROM public.adoption_applications 
WHERE listing_id IN ('adopt_01', 'adopt_02', 'adopt_03', 'adopt_04', 'adopt_05', 'adopt_06')
   OR applicant_id IN ('usr_citizen_01', 'usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04');

DELETE FROM public.adoptions 
WHERE id IN ('adopt_01', 'adopt_02', 'adopt_03', 'adopt_04', 'adopt_05', 'adopt_06')
   OR publisher_id IN ('usr_citizen_01', 'usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04', 'resp_assoc_01', 'resp_vet_01');

-- 5. Delete demo notifications
DELETE FROM public.notifications 
WHERE id IN ('notif_01', 'notif_02', 'notif_03')
   OR user_id IN ('usr_citizen_01', 'usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04');

-- 6. Delete demo volunteer profiles
DELETE FROM public.volunteer_profiles 
WHERE id IN ('vol_01', 'vol_02', 'vol_03', 'vol_04')
   OR user_id IN ('usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04');

-- 7. Delete demo responder documents and profiles
DELETE FROM public.responder_documents 
WHERE responder_id IN ('resp_assoc_01', 'resp_vet_01', 'resp_assoc_02');

DELETE FROM public.responder_profiles 
WHERE id IN ('resp_assoc_01', 'resp_vet_01', 'resp_assoc_02');

-- 8. Delete demo seed citizen profile if present
DELETE FROM public.profiles 
WHERE id::text IN ('usr_citizen_01', 'usr_vol_01', 'usr_vol_02', 'usr_vol_03', 'usr_vol_04');

COMMIT;

-- Verification query: ensure all demo records have been successfully eliminated
SELECT 'reports_remaining' as check_type, count(*) as count FROM public.reports WHERE id IN ('rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03')
UNION ALL
SELECT 'adoptions_remaining', count(*) FROM public.adoptions WHERE id IN ('adopt_01', 'adopt_02', 'adopt_03', 'adopt_04', 'adopt_05', 'adopt_06')
UNION ALL
SELECT 'responders_remaining', count(*) FROM public.responder_profiles WHERE id IN ('resp_assoc_01', 'resp_vet_01', 'resp_assoc_02');
