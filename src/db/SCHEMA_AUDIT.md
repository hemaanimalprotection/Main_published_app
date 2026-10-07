# Comprehensive Supabase Database Audit & Architecture Report

## 1. Application Database Inventory

This inventory was compiled through a full audit of the application source code (`src/services/dataService.ts`, `src/context/AuthContext.tsx`, `src/types/index.ts`, `src/components/modals/AuthModal.tsx`, `src/services/supabase.ts`, etc.).

### 1.1 Discovered Database Tables

| Table Name | Primary Key | Description & Role in Platform | Key Dependencies |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id UUID` | Master identity profiles extending `auth.users(id)`. Stores unified account data (email, phone, governorate, role, language preference). | `auth.users` |
| `public.phone_verifications` | `id UUID` | High-security Syrian mobile phone verification OTP hashes and attempt tracking. | None |
| `public.responder_profiles` | `id UUID` | Licensed animal protection entities: rescue associations and registered veterinarians. | `public.profiles` |
| `public.responder_documents` | `id UUID` | Verification credentials, veterinary license PDFs, ministry registration files. | `public.responder_profiles` |
| `public.volunteer_profiles` | `id UUID` | Syria-wide field volunteer network (transport, emergency first-aid, foster, logistics). | `public.profiles` |
| `public.reports` | `id UUID` | Central emergency animal distress and abuse reports across all 14 Syrian governorates. | `public.profiles`, `public.responder_profiles`, `public.volunteer_profiles` |
| `public.volunteer_dispatches` | `id UUID` | Urgent field requests sent by associations/clinics to local volunteers. | `public.reports`, `public.profiles`, `public.volunteer_profiles` |
| `public.report_private_details` | `report_id UUID` | Confidential reporter contact phone number and exact micro-coordinates. | `public.reports` |
| `public.report_media` | `id UUID` | Photographs and videos documenting animal condition and rescue progress. | `public.reports` |
| `public.report_responsibilities` | `id UUID` | Atomic tracking of lead responder acceptance, handover, and relinquishment. | `public.reports`, `public.responder_profiles` |
| `public.report_collaborators` | `id UUID` | Multi-organization cooperation (joint rescue, clinic care, temporary fostering). | `public.reports`, `public.responder_profiles`, `public.profiles` |
| `public.report_status_history` | `id UUID` | Immutable audit trail of every status transition with actor IDs and notes. | `public.reports`, `public.profiles` |
| `public.report_updates` | `id UUID` | Public bulletin timeline updates informing the citizen of rescue milestones. | `public.reports`, `public.profiles` |
| `public.report_private_notes` | `id UUID` | Sensitive internal veterinary records and coordination notes between responders. | `public.reports`, `public.profiles` |
| `public.adoption_listings` | `id UUID` | Rescued animal profiles available for permanent adoption across Syria. | `public.profiles` |
| `public.adoption_applications` | `id UUID` | Citizen adoption screening questionnaires and home suitability requests. | `public.adoption_listings`, `public.profiles` |
| `public.notifications` | `id UUID` | In-app alerts for status changes, responsibility acceptance, and dispatches. | `public.profiles`, `public.reports`, `public.adoption_listings` |
| `public.audit_logs` | `id UUID` | System-wide operational and administrative event logging. | `public.profiles` |

---

### 1.2 Custom PostgreSQL ENUMs & Types

- `public.user_role`: `'citizen'`, `'responder'`, `'volunteer'`
- `public.responder_type`: `'association'`, `'veterinarian'`
- `public.verification_status`: `'pending'`, `'verified'`, `'rejected'`
- `public.animal_type`: `'cat'`, `'dog'`, `'bird'`, `'horse_donkey'`, `'farm_animal'`, `'wildlife'`, `'other'`
- `public.problem_category`: `'abuse_violence'`, `'injured'`, `'sick'`, `'abandoned'`, `'homeless'`, `'trapped'`, `'road_accident'`, `'poisoning'`, `'food_water'`, `'mother_babies'`, `'shelter_needed'`, `'other_emergency'`
- `public.severity_level`: `'low'`, `'medium'`, `'high'`, `'critical'`
- `public.report_status`: `'submitted'`, `'under_review'`, `'waiting_responder'`, `'responsibility_accepted'`, `'responder_on_way'`, `'animal_located'`, `'receiving_veterinary_care'`, `'sheltered_or_fostered'`, `'adoption_process'`, `'resolved'`, `'closed'`, `'duplicate'`, `'invalid'`
- `public.adoption_status`: `'draft'`, `'published'`, `'reserved'`, `'adopted'`, `'archived'`
- `public.application_status`: `'pending'`, `'under_review'`, `'approved'`, `'rejected'`, `'withdrawn'`
- `public.collaboration_role`: `'rescue'`, `'veterinary_care'`, `'shelter'`, `'foster'`, `'transport'`, `'food_support'`, `'adoption'`
- `public.collaboration_status`: `'pending'`, `'accepted'`, `'declined'`

---

### 1.3 Key Relationships & Foreign Keys

- `profiles.id` $\to$ `auth.users(id)` `ON DELETE CASCADE`
- `profiles.volunteer_profile_id` $\to$ `volunteer_profiles(id)` `ON DELETE SET NULL` *(deferred constraint)*
- `responder_profiles.user_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `volunteer_profiles.user_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `reports.reporter_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `reports.lead_responder_id` $\to$ `responder_profiles(id)` `ON DELETE SET NULL`
- `reports.assigned_volunteer_id` $\to$ `volunteer_profiles(id)` `ON DELETE SET NULL`
- `volunteer_dispatches.report_id` $\to$ `reports(id)` `ON DELETE SET NULL`
- `volunteer_dispatches.sender_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `volunteer_dispatches.volunteer_id` $\to$ `volunteer_profiles(id)` `ON DELETE CASCADE`
- `report_private_details.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_media.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_responsibilities.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_responsibilities.responder_id` $\to$ `responder_profiles(id)` `ON DELETE CASCADE`
- `report_collaborators.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_collaborators.responder_id` $\to$ `responder_profiles(id)` `ON DELETE CASCADE`
- `report_collaborators.invited_by` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `report_status_history.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_updates.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `report_private_notes.report_id` $\to$ `reports(id)` `ON DELETE CASCADE`
- `adoption_listings.publisher_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `adoption_applications.listing_id` $\to$ `adoption_listings(id)` `ON DELETE CASCADE`
- `adoption_applications.applicant_id` $\to$ `profiles(id)` `ON DELETE CASCADE`
- `notifications.user_id` $\to$ `profiles(id)` `ON DELETE CASCADE`

---

## 2. Major Problems Identified in Old Schema & Solutions

### 1. `relation "public.reports" does not exist`
- **Cause**: In previous schema versions, tables such as `volunteer_dispatches` or foreign key definitions were declared before `public.reports` had been created.
- **Resolution**: Strict topological sorting. All base identity tables (`profiles`, `responder_profiles`, `volunteer_profiles`) are declared first. `public.reports` is declared immediately afterward, before any table that references it.

### 2. `type "user_role" does not exist` during Supabase Auth Signup/Invite
- **Cause**: Supabase's authentication service (GoTrue) connects with a restrictive `search_path` (e.g. `'auth, pg_temp'`). When `on_auth_user_created` fired, the trigger function lacked `SET search_path = public, pg_temp` and referenced unqualified `user_role`, causing PostgreSQL to search `auth.user_role` and fail with error `42704: type "user_role" does not exist`. This caused GoTrue to roll back the user creation with `Database error saving new user`.
- **Resolution**:
  - `handle_new_auth_user()` is declared `SECURITY DEFINER` with explicit `SET search_path = public, pg_temp`.
  - Type declarations and casts use fully qualified `public.user_role`.
  - The profile initialization logic inside `handle_new_auth_user()` is isolated in an internal `BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING ... END;` block, guaranteeing that user creation in `auth.users` is never aborted.
  - Granted `USAGE ON TYPE public.user_role` explicitly to `anon`, `authenticated`, `service_role`, and `supabase_auth_admin`.

### 3. Invalid PostgreSQL Syntax: `GRANT USAGE ON ALL TYPES IN SCHEMA public ...`
- **Cause**: PostgreSQL does not have an `ALL TYPES IN SCHEMA` clause for the `GRANT` statement. `GRANT ... ON ALL ... IN SCHEMA` is valid only for `TABLES`, `SEQUENCES`, and `ROUTINES`.
- **Resolution**: Replaced with individual, standard PostgreSQL `GRANT USAGE ON TYPE public.<type_name> TO ...` statements.

### 4. Extension-Dependent UUID Defaults
- **Cause**: Use of `uuid_generate_v4()` required the `uuid-ossp` extension to be in `search_path`. If Supabase installed the extension into `extensions`, unqualified calls could fail.
- **Resolution**: Standardized on PostgreSQL 13+ native `gen_random_uuid()` from `pg_catalog`, which is always available regardless of `search_path`.

### 5. Missing RLS Policies on Critical Tables
- **Cause**: Tables like `report_media`, `report_responsibilities`, `report_collaborators`, `report_status_history`, `report_updates`, and `responder_documents` had RLS enabled but had zero policies, completely locking out non-service_role users.
- **Resolution**: Implemented comprehensive, secure RLS policies for every table in the schema.

---

## 3. Canonical Schema Execution Order

The regenerated `src/db/supabase-schema.sql` follows this sequential dependency order:

1. **Extensions**:
   - `uuid-ossp`, `pgcrypto`
   - Grant `USAGE ON SCHEMA public` to standard roles and `supabase_auth_admin`.
2. **Custom ENUM Types**:
   - 11 custom domain enums defined with idempotence.
   - Standard `GRANT USAGE ON TYPE public.<type> TO anon, authenticated, service_role, supabase_auth_admin`.
3. **Independent / Base Tables**:
   - `profiles`
   - `phone_verifications`
   - `responder_profiles`
   - `responder_documents`
   - `volunteer_profiles`
4. **Dependent Tables**:
   - `reports` *(created first among dependent tables)*
   - `volunteer_dispatches`
   - `report_private_details`
   - `report_media`
   - `report_responsibilities`
   - `report_collaborators`
   - `report_status_history`
   - `report_updates`
   - `report_private_notes`
   - `adoption_listings`
   - `adoption_applications`
   - `notifications`
   - `audit_logs`
5. **Deferred Foreign Keys**:
   - `profiles.volunteer_profile_id` $\to$ `volunteer_profiles(id)`
6. **Indexes**:
   - High-throughput b-tree indexes on foreign keys, statuses, governorates, and partial unique index on active lead responder.
7. **Helper & Security Functions**:
   - `is_approved_responder(uid UUID)`
   - `is_lead_responder(p_report_id UUID, uid UUID)`
   - `GRANT EXECUTE` on both functions.
8. **Table Permissions & RLS Enablement**:
   - `GRANT ALL ON ALL TABLES/SEQUENCES IN SCHEMA public`
   - `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;` on all 18 tables.
9. **RLS Policies**:
   - Granular SELECT, INSERT, UPDATE, DELETE policies for each table.
10. **Application RPC Functions**:
    - `accept_report_responsibility(p_report_id UUID, p_initial_notes TEXT)`
    - `update_report_status(p_report_id UUID, p_new_status public.report_status, ...)`
    - `GRANT EXECUTE` on both functions.
11. **Triggers**:
    - Table-level maintenance triggers.
12. **Auth Integration (Created LAST)**:
    - `handle_new_auth_user()` trigger function with `SECURITY DEFINER`, `SET search_path = public, pg_temp`, and safe exception isolation.
    - `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
    - `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users ...`
