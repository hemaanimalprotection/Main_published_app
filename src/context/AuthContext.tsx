import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ResponderProfile, VolunteerProfile, UserRole, AccountType } from '../types';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { isEmailAddress, normalizePhoneNumber } from '../utils/countryData';

export type AuthExperience = 'public' | 'citizen' | 'responder' | 'volunteer';

export interface SignUpParams {
  role: 'citizen' | 'association' | 'veterinarian' | 'volunteer';
  contactMethod: 'email' | 'phone';
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  governorate: string;
  city: string;
  neighborhood?: string;
  
  // Association / Vet specific
  orgName?: string;
  contactPerson?: string;
  clinicName?: string;
  clinicAddress?: string;
  specialty?: string;
  registrationNumber?: string;
  servicesOffered?: string[];
  documentFile?: {
    name: string;
    type: string;
    dataUrl: string;
    sizeKb?: number;
  };
  
  // Volunteer specific
  selectedRoles?: any[];
  hasVehicle?: boolean;
  vehicleType?: string;
  shelterCapacityNote?: string;
  otherHelpDetails?: string;
  availability?: 'available' | 'emergency_on_call' | 'weekends_only' | 'busy';
  experienceNote?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  responderProfile: ResponderProfile | null;
  volunteerProfile: VolunteerProfile | null;
  accountType: AccountType | null;
  experience: AuthExperience;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCitizen: boolean;
  isAssociation: boolean;
  isVeterinarian: boolean;
  isVolunteer: boolean;
  isResponder: boolean;
  isVerifiedResponder: boolean;
  isPendingResponder: boolean;
  isApprovedAssociation: boolean;
  isApprovedVeterinarian: boolean;
  needsRoleSetup: boolean;

  // Universal Single Sign-In
  signIn: (identifier: string, password: string) => Promise<{
    success: boolean;
    role?: UserRole;
    accountType?: AccountType;
    isPending?: boolean;
    needsRoleSetup?: boolean;
    message?: string;
  }>;

  // Role-selected Registration
  signUp: (params: SignUpParams) => Promise<{
    success: boolean;
    role?: UserRole;
    accountType?: AccountType;
    requiresEmailConfirmation?: boolean;
    requiresPhoneOtp?: boolean;
    message?: string;
  }>;

  // Password Recovery
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  sendPasswordResetPhoneOtp: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyPasswordResetOtp: (phone: string, token: string) => Promise<{ success: boolean; message?: string }>;
  completePasswordReset: (newPassword: string) => Promise<{ success: boolean; message?: string }>;

  // Account Role Setup (when account exists with no valid role)
  completeAccountRoleSetup: (
    role: 'citizen' | 'association' | 'veterinarian' | 'volunteer',
    extraDetails: any
  ) => Promise<{ success: boolean; message?: string }>;

  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Legacy compatibility adapters
  loginAsCitizen: (phone: string, name: string, governorate?: string, city?: string) => Promise<void>;
  loginAsResponder: (responderId: string) => Promise<void>;
  registerAndLoginResponder: (data: Omit<ResponderProfile, 'id' | 'createdAt' | 'verificationStatus'>) => Promise<ResponderProfile>;
  loginAsVolunteer: (volunteerId: string) => Promise<void>;
  requestPhoneOtp: (phone: string) => Promise<{ success: boolean; code?: string; message?: string }>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Preserve existing account from local storage
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hema_auth_user') || localStorage.getItem('mawa_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'usr_citizen_01') {
          localStorage.removeItem('mawa_auth_user');
          localStorage.removeItem('hema_auth_user');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [responderProfile, setResponderProfile] = useState<ResponderProfile | null>(() => {
    const saved = localStorage.getItem('hema_auth_responder') || localStorage.getItem('mawa_auth_responder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'resp_assoc_01' || parsed?.id === 'resp_vet_01' || parsed?.id === 'resp_assoc_02') {
          localStorage.removeItem('mawa_auth_responder');
          localStorage.removeItem('hema_auth_responder');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(() => {
    const saved = localStorage.getItem('hema_auth_volunteer') || localStorage.getItem('mawa_auth_volunteer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'vol_01' || parsed?.id === 'vol_02' || parsed?.id === 'vol_03' || parsed?.id === 'vol_04') {
          localStorage.removeItem('mawa_auth_volunteer');
          localStorage.removeItem('hema_auth_volunteer');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Track if current authenticated user has no valid role
  const [needsRoleSetup, setNeedsRoleSetup] = useState<boolean>(() => {
    if (user && (!user.role || !['citizen', 'responder', 'volunteer'].includes(user.role))) {
      return true;
    }
    return false;
  });

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(
    user?.isAdmin || 
    (user?.email && user.email.toLowerCase() === 'sameh.saad.cg@gmail.com')
  );
  const isVolunteer = Boolean(
    user?.role === 'volunteer' || 
    user?.volunteerEnabled || 
    Boolean(volunteerProfile)
  );
  const isResponder = user?.role === 'responder';
  const isAssociation = Boolean(
    responderProfile?.responderType === 'association' || 
    (user?.role === 'responder' && !responderProfile?.clinicName && responderProfile?.name) ||
    (user as any)?.intendedUsage === 'association' ||
    (user as any)?.accountType === 'association'
  );
  const isVeterinarian = Boolean(responderProfile?.responderType === 'veterinarian');
  const isVerifiedResponder = (isResponder && (responderProfile?.verificationStatus === 'verified' || isAssociation)) || isAdmin;
  const isPendingResponder = isResponder && responderProfile?.verificationStatus === 'pending' && !isAssociation && !isAdmin;
  const isApprovedAssociation = isAssociation;
  const isApprovedVeterinarian = (isVeterinarian && responderProfile?.verificationStatus === 'verified') || (isAdmin && isVeterinarian);

  const accountType: AccountType | null = !user 
    ? null 
    : isAssociation
      ? 'association'
      : isVolunteer
        ? 'volunteer'
        : user.role === 'responder'
          ? (responderProfile?.responderType === 'veterinarian' ? 'veterinarian' : 'association')
          : 'citizen';

  const isCitizen = accountType === 'citizen';

  const experience: AuthExperience = !user 
    ? 'public' 
    : isAssociation || user.role === 'responder' 
      ? 'responder' 
      : isVolunteer
        ? 'volunteer'
        : 'citizen';

  const saveAuth = (
    newUser: UserProfile | null, 
    newResponder: ResponderProfile | null = null,
    newVolunteer: VolunteerProfile | null = null
  ) => {
    setUser(newUser);
    setResponderProfile(newResponder);
    setVolunteerProfile(newVolunteer);

    if (newUser) {
      const roleValid = newUser.role && ['citizen', 'responder', 'volunteer'].includes(newUser.role);
      setNeedsRoleSetup(!roleValid);
      localStorage.setItem('hema_auth_user', JSON.stringify(newUser));
      localStorage.setItem('mawa_auth_user', JSON.stringify(newUser));
    } else {
      setNeedsRoleSetup(false);
      localStorage.removeItem('hema_auth_user');
      localStorage.removeItem('mawa_auth_user');
    }

    if (newResponder) {
      localStorage.setItem('hema_auth_responder', JSON.stringify(newResponder));
      localStorage.setItem('mawa_auth_responder', JSON.stringify(newResponder));
    } else {
      localStorage.removeItem('hema_auth_responder');
      localStorage.removeItem('mawa_auth_responder');
    }

    if (newVolunteer) {
      localStorage.setItem('hema_auth_volunteer', JSON.stringify(newVolunteer));
      localStorage.setItem('mawa_auth_volunteer', JSON.stringify(newVolunteer));
    } else {
      localStorage.removeItem('hema_auth_volunteer');
      localStorage.removeItem('mawa_auth_volunteer');
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    saveAuth(null, null, null);
  };

  // Helper to fetch user details and role from database
  const loadProfileForUser = async (userId: string, authUserMeta?: any): Promise<{
    userProfile: UserProfile | null;
    responder: ResponderProfile | null;
    volunteer: VolunteerProfile | null;
    needsRole: boolean;
  }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        let profileRowData = profileRow;

        // If profile row doesn't exist, create it from auth metadata
        if (!profileRowData) {
          const isAssocInit = Boolean(
            authUserMeta?.intended_usage === 'association' ||
            authUserMeta?.account_type === 'association' ||
            authUserMeta?.responder_type === 'association' ||
            authUserMeta?.org_name
          );
          const isVetInit = Boolean(
            authUserMeta?.intended_usage === 'veterinarian' ||
            authUserMeta?.account_type === 'veterinarian' ||
            authUserMeta?.clinic_name
          );
          const initialRole: UserRole = isAssocInit || isVetInit || authUserMeta?.role === 'responder'
            ? 'responder'
            : authUserMeta?.role === 'volunteer'
              ? 'volunteer'
              : 'citizen';

          const { data: createdProf } = await supabase.from('profiles').upsert({
            id: userId,
            role: initialRole,
            full_name: authUserMeta?.full_name || authUserMeta?.org_name || 'مستخدم مسجل',
            email: authUserMeta?.email,
            phone: authUserMeta?.phone || '',
            governorate: authUserMeta?.governorate || 'damascus',
            city: authUserMeta?.city || 'دمشق',
            neighborhood: authUserMeta?.neighborhood || '',
            language_preference: 'ar'
          }).select().single();

          if (createdProf) {
            profileRowData = createdProf;
          }
        }

        if (profileRowData) {
          let role = profileRowData.role as UserRole;
          let responder: ResponderProfile | null = null;
          let volunteer: VolunteerProfile | null = null;

          // Check if metadata indicates this account is an Animal Association or Responder
          const isAssocMeta = Boolean(
            authUserMeta?.intended_usage === 'association' ||
            authUserMeta?.account_type === 'association' ||
            authUserMeta?.responder_type === 'association' ||
            authUserMeta?.org_name ||
            authUserMeta?.registration_number
          );
          const isVetMeta = Boolean(
            authUserMeta?.intended_usage === 'veterinarian' ||
            authUserMeta?.account_type === 'veterinarian' ||
            authUserMeta?.responder_type === 'veterinarian' ||
            authUserMeta?.clinic_name
          );

          if (isAssocMeta || isVetMeta || role === 'responder') {
            role = 'responder';
            const { data: respRow } = await supabase
              .from('responder_profiles')
              .select('*, responder_documents(*)')
              .eq('user_id', userId)
              .maybeSingle();

            if (respRow) {
              const isAssoc = respRow.responder_type === 'association' || isAssocMeta;
              responder = {
                id: respRow.id,
                userId: respRow.user_id,
                responderType: isAssoc ? 'association' : respRow.responder_type,
                verificationStatus: isAssoc ? 'verified' : respRow.verification_status,
                name: respRow.name || authUserMeta?.org_name || 'جمعية حماية الحيوان',
                title: respRow.title || (isAssoc ? 'جمعية حماية الحيوان' : 'طبيب بيطري'),
                specialty: respRow.specialty,
                description: respRow.description || 'جمعية معتمدة عبر المنصة الوطنية لحماية الحيوان',
                responsibleContactPerson: respRow.responsible_contact_person || authUserMeta?.contact_person || '',
                email: respRow.email || profileRowData.email,
                phone: respRow.phone || profileRowData.phone,
                governoratesServed: (respRow.governorates_served && respRow.governorates_served.length > 0)
                  ? respRow.governorates_served
                  : [profileRowData.governorate || authUserMeta?.governorate || 'damascus'],
                citiesServed: (respRow.cities_served && respRow.cities_served.length > 0)
                  ? respRow.cities_served
                  : [profileRowData.city || authUserMeta?.city || 'دمشق'],
                servicesOffered: respRow.services_offered || ['rescue', 'veterinary_care', 'shelter'],
                clinicName: respRow.clinic_name,
                clinicAddress: respRow.clinic_address,
                registrationNumber: respRow.registration_number || authUserMeta?.registration_number,
                supportingDocumentUrls: respRow.supporting_document_urls || [],
                rejectionReason: respRow.rejection_reason,
                reviewedAt: respRow.reviewed_at,
                reviewedBy: respRow.reviewed_by,
                documents: Array.isArray(respRow.responder_documents) ? respRow.responder_documents.map((d: any) => ({
                  id: d.id,
                  responderId: d.responder_id,
                  documentType: d.document_type,
                  fileUrl: d.file_url,
                  fileName: d.file_name,
                  fileSizeKb: d.file_size_kb,
                  uploadedAt: d.uploaded_at
                })) : [],
                availability: respRow.availability || 'available',
                createdAt: respRow.created_at
              };
            } else if (isAssocMeta || isVetMeta || role === 'responder') {
              // Self-heal: Association or responder signed in after email confirmation but responder_profiles is missing
              const targetRespType = isVetMeta ? 'veterinarian' : 'association';
              const targetStatus = isVetMeta ? 'pending' : 'verified';
              const targetName = authUserMeta?.org_name?.trim() || 
                                 authUserMeta?.clinic_name?.trim() || 
                                 profileRowData.full_name?.trim() || 
                                 authUserMeta?.full_name?.trim() || 
                                 (isVetMeta ? 'عيادة بيطرية' : 'جمعية حماية الحيوان');
              const targetContact = authUserMeta?.contact_person?.trim() || profileRowData.full_name?.trim() || '';
              const targetGov = profileRowData.governorate || authUserMeta?.governorate || 'damascus';
              const targetCity = profileRowData.city || authUserMeta?.city || 'دمشق';
              const targetRegNum = authUserMeta?.registration_number?.trim() || '';
              const targetServices = authUserMeta?.services_offered || ['rescue', 'veterinary_care', 'shelter'];

              try {
                const { data: newRespRow } = await supabase
                  .from('responder_profiles')
                  .insert({
                    user_id: userId,
                    responder_type: targetRespType,
                    verification_status: targetStatus,
                    name: targetName,
                    title: isVetMeta ? 'طبيب بيطري' : 'جمعية حماية الحيوان',
                    description: isVetMeta ? 'طبيب بيطري معتمد' : 'جمعية معتمدة عبر المنصة الوطنية لحماية الحيوان',
                    responsible_contact_person: targetContact,
                    email: profileRowData.email || authUserMeta?.email || 'contact@hema.sy',
                    phone: profileRowData.phone || authUserMeta?.phone || '',
                    governorates_served: [targetGov],
                    cities_served: [targetCity],
                    services_offered: targetServices,
                    clinic_name: authUserMeta?.clinic_name,
                    clinic_address: authUserMeta?.clinic_address,
                    registration_number: targetRegNum,
                    availability: 'available'
                  })
                  .select('*, responder_documents(*)')
                  .maybeSingle();

                if (newRespRow) {
                  responder = {
                    id: newRespRow.id,
                    userId: newRespRow.user_id,
                    responderType: newRespRow.responder_type,
                    verificationStatus: targetStatus,
                    name: newRespRow.name,
                    title: newRespRow.title,
                    specialty: newRespRow.specialty,
                    description: newRespRow.description || '',
                    responsibleContactPerson: newRespRow.responsible_contact_person,
                    email: newRespRow.email,
                    phone: newRespRow.phone,
                    governoratesServed: newRespRow.governorates_served || [targetGov],
                    citiesServed: newRespRow.cities_served || [targetCity],
                    servicesOffered: newRespRow.services_offered || targetServices,
                    registrationNumber: newRespRow.registration_number,
                    documents: [],
                    availability: 'available',
                    createdAt: newRespRow.created_at
                  };
                }
              } catch (insErr) {
                console.warn('Auto-provisioning responder profile failed or already exists:', insErr);
              }

              // Update profiles table to ensure role is permanently responder in database
              if (profileRowData.role !== 'responder') {
                await supabase.from('profiles').update({ role: 'responder' }).eq('id', userId);
                profileRowData.role = 'responder';
              }
            }
          }

          // Always check for volunteer profile regardless of role (Citizen + Volunteer capabilities)
          const { data: volRow } = await supabase
            .from('volunteer_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (volRow) {
            volunteer = {
              id: volRow.id,
              userId: volRow.user_id,
              fullName: volRow.full_name,
              phone: volRow.phone,
              email: volRow.email,
              governorate: volRow.governorate,
              city: volRow.city,
              neighborhood: volRow.neighborhood,
              roles: volRow.roles || [],
              hasVehicle: volRow.has_vehicle,
              vehicleType: volRow.vehicle_type,
              shelterCapacityNote: volRow.shelter_capacity_note,
              otherHelpDetails: volRow.other_help_details,
              availability: volRow.availability || 'available',
              verificationStatus: volRow.verification_status || 'active',
              totalAssistsCount: volRow.total_assists_count || 0,
              rating: volRow.rating || 5.0,
              createdAt: volRow.created_at
            };
          }

          // Determine admin privileges
          let isUserAdmin = Boolean(
            profileRowData.is_admin || 
            (profileRowData.email && profileRowData.email.toLowerCase() === 'sameh.saad.cg@gmail.com')
          );

          if (!isUserAdmin) {
            const { data: adminRow } = await supabase
              .from('admin_users')
              .select('user_id')
              .eq('user_id', userId)
              .maybeSingle();
            if (adminRow) {
              isUserAdmin = true;
            }
          }

          const effectiveRole = responder ? 'responder' : role;
          const hasValidRole = Boolean(effectiveRole && ['citizen', 'responder', 'volunteer'].includes(effectiveRole));

          const userProfile: UserProfile = {
            id: profileRowData.id,
            role: hasValidRole ? effectiveRole : ('' as any),
            isAdmin: isUserAdmin,
            volunteerEnabled: Boolean(profileRowData.volunteer_enabled || volunteer),
            phone: profileRowData.phone || '',
            phoneVerified: profileRowData.phone_verified ?? false,
            fullName: responder?.name || profileRowData.full_name || 'مستخدم مسجل',
            email: profileRowData.email,
            governorate: profileRowData.governorate || 'damascus',
            city: profileRowData.city || 'دمشق',
            neighborhood: profileRowData.neighborhood || '',
            languagePreference: profileRowData.language_preference || 'ar',
            volunteerProfileId: volunteer?.id,
            createdAt: profileRowData.created_at || new Date().toISOString(),
            updatedAt: profileRowData.updated_at || new Date().toISOString()
          };

          return { userProfile, responder, volunteer, needsRole: !hasValidRole };
        }
      } catch (err) {
        console.error('Error fetching Supabase profile:', err);
      }
    }

    // Fallback if local/cached or meta available
    if (authUserMeta) {
      const metaRole = authUserMeta.role as UserRole;
      const hasValidRole = Boolean(metaRole && ['citizen', 'responder', 'volunteer'].includes(metaRole));
      const u: UserProfile = {
        id: userId,
        role: hasValidRole ? metaRole : ('' as any),
        phone: authUserMeta.phone || '',
        phoneVerified: true,
        fullName: authUserMeta.full_name || 'مستخدم مسجل',
        email: authUserMeta.email,
        governorate: authUserMeta.governorate || 'damascus',
        city: authUserMeta.city || 'دمشق',
        neighborhood: authUserMeta.neighborhood || '',
        languagePreference: 'ar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { userProfile: u, responder: null, volunteer: null, needsRole: !hasValidRole };
    }

    return { userProfile: null, responder: null, volunteer: null, needsRole: true };
  };

  // Listen to Supabase Auth State Changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { userProfile, responder, volunteer, needsRole } = await loadProfileForUser(
          session.user.id,
          session.user.user_metadata
        );

        if (userProfile) {
          saveAuth(userProfile, responder, volunteer);
          setNeedsRoleSetup(needsRole);
        } else {
          // Account exists without a profile row yet -> needs role setup
          const fallbackUser: UserProfile = {
            id: session.user.id,
            role: '' as any,
            phone: session.user.phone || '',
            phoneVerified: Boolean(session.user.phone_confirmed_at),
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email,
            governorate: 'damascus',
            city: 'دمشق',
            languagePreference: 'ar',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveAuth(fallbackUser, null, null);
          setNeedsRoleSetup(true);
        }
      } else if (event === 'SIGNED_OUT') {
        saveAuth(null, null, null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Universal Single Sign-In for all user types
  const signIn = async (
    identifier: string, 
    password: string
  ): Promise<{ 
    success: boolean; 
    role?: UserRole; 
    accountType?: AccountType;
    isPending?: boolean;
    needsRoleSetup?: boolean; 
    message?: string; 
  }> => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      // Supabase is not configured in this environment
      return {
        success: false,
        message: 'يتطلب تسجيل الدخول ربط مشروع Supabase الحقيقي وضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف البيئة.'
      };
    }

    try {
      let authResponse;
      if (isEmailAddress(cleanId)) {
        authResponse = await supabase.auth.signInWithPassword({
          email: cleanId.toLowerCase(),
          password
        });
      } else {
        // Phone login - normalize to E.164
        const normalizedPhone = normalizePhoneNumber(cleanId);
        authResponse = await supabase.auth.signInWithPassword({
          phone: normalizedPhone,
          password
        });
      }

      if (authResponse.error) {
        return {
          success: false,
          message: authResponse.error.message || 'بيانات الدخول غير صحيحة.'
        };
      }

      const authUser = authResponse.data.user;
      if (!authUser) {
        return { success: false, message: 'فشل استرجاع بيانات الحساب من مزود المصادقة.' };
      }

      // Retrieve saved role from the database
      const { userProfile, responder, volunteer, needsRole } = await loadProfileForUser(
        authUser.id,
        authUser.user_metadata
      );

      if (!userProfile || needsRole) {
        const setupUser: UserProfile = {
          id: authUser.id,
          role: '' as any,
          phone: authUser.phone || '',
          phoneVerified: Boolean(authUser.phone_confirmed_at),
          fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'مستخدم',
          email: authUser.email,
          governorate: 'damascus',
          city: 'دمشق',
          languagePreference: 'ar',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveAuth(setupUser, null, null);
        setNeedsRoleSetup(true);
        return { success: true, needsRoleSetup: true };
      }

      saveAuth(userProfile, responder, volunteer);
      const computedAccountType: AccountType = userProfile.role === 'volunteer'
        ? 'volunteer'
        : userProfile.role === 'responder'
          ? (responder?.responderType === 'veterinarian' ? 'veterinarian' : 'association')
          : 'citizen';
      const isPending = userProfile.role === 'responder' && responder?.verificationStatus === 'pending' && responder?.responderType !== 'association';

      return { 
        success: true, 
        role: userProfile.role, 
        accountType: computedAccountType,
        isPending,
        needsRoleSetup: false 
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى إعادة المحاولة.'
      };
    }
  };

  // Registration with Selected Role
  const signUp = async (params: SignUpParams): Promise<{
    success: boolean;
    role?: UserRole;
    accountType?: AccountType;
    requiresEmailConfirmation?: boolean;
    requiresPhoneOtp?: boolean;
    message?: string;
  }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'يتطلب إنشاء الحساب الحقيقي ربط مشروع Supabase وضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.'
      };
    }

    try {
      const isAssoc = params.role === 'association';
      const isVet = params.role === 'veterinarian';
      const mappedRole: UserRole = 
        isAssoc || isVet
          ? 'responder'
          : params.role === 'volunteer'
            ? 'volunteer'
            : 'citizen';

      const respType = isVet ? 'veterinarian' : 'association';
      const respName = params.orgName?.trim() || params.clinicName?.trim() || params.fullName.trim();
      const initialVerificationStatus = isAssoc ? 'verified' : 'pending';

      const metadata: Record<string, any> = {
        role: mappedRole,
        account_type: params.role,
        intended_usage: params.role,
        full_name: params.fullName.trim(),
        governorate: params.governorate,
        city: params.city,
        neighborhood: params.neighborhood?.trim() || '',
        responder_type: respType,
        org_name: params.orgName?.trim() || respName,
        contact_person: params.contactPerson?.trim() || params.fullName.trim(),
        registration_number: params.registrationNumber?.trim() || '',
        clinic_name: params.clinicName?.trim() || '',
        clinic_address: params.clinicAddress?.trim() || '',
        specialty: params.specialty?.trim() || (isVet ? 'طبيب بيطري' : 'جمعية حماية الحيوان'),
        services_offered: params.servicesOffered || ['rescue', 'veterinary_care', 'shelter'],
        verification_status: initialVerificationStatus
      };

      let authResult;
      if (params.contactMethod === 'email') {
        if (!params.email || !isEmailAddress(params.email)) {
          return { success: false, message: 'يرجى إدخال بريد إلكتروني صحيح.' };
        }
        metadata.email = params.email.trim().toLowerCase();
        authResult = await supabase.auth.signUp({
          email: params.email.trim().toLowerCase(),
          password: params.password,
          options: { data: metadata }
        });
      } else {
        if (!params.phone) {
          return { success: false, message: 'يرجى إدخال رقم هاتف صحيح.' };
        }
        const normalizedPhone = normalizePhoneNumber(params.phone);
        metadata.phone = normalizedPhone;
        authResult = await supabase.auth.signUp({
          phone: normalizedPhone,
          password: params.password,
          options: { data: metadata }
        });
      }

      if (authResult.error) {
        return {
          success: false,
          message: authResult.error.message || 'فشل إنشاء الحساب عبر مزود المصادقة.'
        };
      }

      const authUser = authResult.data.user;
      if (!authUser) {
        return { success: false, message: 'لم يتم استرجاع معلومات الحساب.' };
      }

      // Check if confirmation is required
      const isConfirmed = Boolean(authUser.confirmed_at || authUser.phone_confirmed_at);
      const requiresEmail = params.contactMethod === 'email' && !isConfirmed;
      const requiresPhone = params.contactMethod === 'phone' && !isConfirmed;

      // Create or update database profiles
      const profileId = authUser.id;
      const userProf: UserProfile = {
        id: profileId,
        role: mappedRole,
        phone: params.phone ? normalizePhoneNumber(params.phone) : '',
        phoneVerified: !requiresPhone,
        fullName: params.fullName.trim(),
        email: params.email?.trim().toLowerCase(),
        governorate: params.governorate,
        city: params.city,
        neighborhood: params.neighborhood?.trim() || '',
        languagePreference: 'ar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let respProf: ResponderProfile | null = null;
      let volProf: VolunteerProfile | null = null;

      // Save profiles in Supabase tables (if session exists; otherwise database trigger and post-confirmation login handle provisioning)
      try {
        await supabase.from('profiles').upsert({
          id: profileId,
          role: mappedRole,
          phone: userProf.phone,
          phone_verified: userProf.phoneVerified,
          full_name: userProf.fullName,
          email: userProf.email,
          governorate: userProf.governorate,
          city: userProf.city,
          neighborhood: userProf.neighborhood,
          language_preference: 'ar'
        });

        if (mappedRole === 'responder') {
          const respType = params.role === 'veterinarian' ? 'veterinarian' : 'association';
          const respName = params.orgName?.trim() || params.clinicName?.trim() || params.fullName.trim();
          const initialStatus = respType === 'association' ? 'verified' : 'pending';
          
          const { data: newResp } = await supabase.from('responder_profiles').insert({
            user_id: profileId,
            responder_type: respType,
            verification_status: initialStatus,
            name: respName,
            title: params.specialty?.trim() || (respType === 'veterinarian' ? 'طبيب بيطري' : 'جمعية حماية الحيوان'),
            description: 'جمعية معتمدة عبر المنصة الوطنية لحماية الحيوان',
            responsible_contact_person: params.contactPerson?.trim() || params.fullName.trim(),
            email: params.email?.trim() || 'contact@hema.sy',
            phone: params.phone ? normalizePhoneNumber(params.phone) : '',
            governorates_served: [params.governorate],
            cities_served: [params.city],
            services_offered: params.servicesOffered || ['rescue', 'veterinary_care', 'shelter'],
            clinic_name: params.clinicName?.trim(),
            clinic_address: params.clinicAddress?.trim(),
            registration_number: params.registrationNumber?.trim(),
            availability: 'available'
          }).select().single();

          if (newResp) {
            respProf = {
              id: newResp.id,
              userId: profileId,
              responderType: respType,
              verificationStatus: initialStatus,
              name: respName,
              description: '',
              email: newResp.email,
              phone: newResp.phone,
              governoratesServed: newResp.governorates_served || [params.governorate],
              citiesServed: newResp.cities_served || [params.city],
              servicesOffered: newResp.services_offered || [],
              availability: 'available',
              createdAt: newResp.created_at
            };
          }
        } else if (mappedRole === 'volunteer') {
          const { data: newVol } = await supabase.from('volunteer_profiles').insert({
            user_id: profileId,
            full_name: params.fullName.trim(),
            phone: params.phone ? normalizePhoneNumber(params.phone) : '',
            email: params.email?.trim() || undefined,
            governorate: params.governorate,
            city: params.city,
            neighborhood: params.neighborhood?.trim(),
            roles: params.selectedRoles || ['transport'],
            has_vehicle: params.hasVehicle ?? false,
            vehicle_type: params.vehicleType?.trim(),
            shelter_capacity_note: params.shelterCapacityNote?.trim(),
            other_help_details: params.otherHelpDetails?.trim(),
            availability: params.availability || 'available',
            experience_note: params.experienceNote?.trim(),
            verification_status: 'active',
            total_assists_count: 0,
            rating: 5.0
          }).select().single();

          if (newVol) {
            volProf = {
              id: newVol.id,
              userId: profileId,
              fullName: newVol.full_name,
              phone: newVol.phone,
              email: newVol.email,
              governorate: newVol.governorate,
              city: newVol.city,
              neighborhood: newVol.neighborhood,
              roles: newVol.roles || [],
              availability: newVol.availability,
              verificationStatus: 'active',
              totalAssistsCount: 0,
              createdAt: newVol.created_at
            };
            userProf.volunteerProfileId = newVol.id;
          }
        }
      } catch (err) {
        console.warn('Direct client profile insert waiting for email confirmation or DB trigger:', err);
      }

      if (!requiresEmail && !requiresPhone) {
        saveAuth(userProf, respProf, volProf);
      }

      const computedAccountType: AccountType = mappedRole === 'volunteer'
        ? 'volunteer'
        : mappedRole === 'responder'
          ? (params.role === 'veterinarian' ? 'veterinarian' : 'association')
          : 'citizen';

      return {
        success: true,
        role: mappedRole,
        accountType: computedAccountType,
        requiresEmailConfirmation: requiresEmail,
        requiresPhoneOtp: requiresPhone
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'فشل تسجيل الحساب. يرجى التحقق من المدخلات.'
      };
    }
  };

  // Password Recovery via Email
  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isEmailAddress(cleanEmail)) {
      return { success: false, message: 'يرجى إدخال عنوان بريد إلكتروني صحيح.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'تتطلب استعادة كلمة المرور ربط Supabase وضبط مزود البريد (SMTP/Auth).'
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}`
      });

      if (error) {
        return { success: false, message: error.message };
      }

      // Neutral recovery confirmation (does not reveal if account exists)
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'فشل إرسال رابط الاستعادة.' };
    }
  };

  // Password Recovery via Phone SMS
  const sendPasswordResetPhoneOtp = async (phone: string): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, message: 'يرجى إدخال رقم هاتف صحيح.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'تتطلب استعادة كلمة المرور عبر SMS ربط Supabase ومزود خدمة الرسائل (Twilio/MessageBird/Vonage).'
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'فشل إرسال رمز التحقق عبر SMS.' };
    }
  };

  // Verify Recovery OTP Code
  const verifyPasswordResetOtp = async (phone: string, token: string): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = normalizePhoneNumber(phone);
    const cleanToken = token.trim();

    if (!cleanToken) {
      return { success: false, message: 'يرجى إدخال رمز التحقق.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'مزود المصادقة Supabase غير مهيأ.'
      };
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: cleanPhone,
        token: cleanToken,
        type: 'sms'
      });

      if (error) {
        return { success: false, message: error.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'فشل التحقق من الرمز.' };
    }
  };

  // Complete Password Reset with New Password
  const completePasswordReset = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'يجب ألا تقل كلمة المرور عن 6 خانات.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'مزود المصادقة Supabase غير مهيأ.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, message: error.message || 'فشل حفظ كلمة المرور الجديدة.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'حدث خطأ أثناء تحديث كلمة المرور.' };
    }
  };

  // Account Role Setup when account exists with no valid role
  const completeAccountRoleSetup = async (
    role: 'citizen' | 'association' | 'veterinarian' | 'volunteer',
    extraDetails: any
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'لا يوجد حساب مسجل حالياً لإكمال إعداده.' };
    }

    const mappedRole: UserRole = 
      role === 'association' || role === 'veterinarian' 
        ? 'responder' 
        : role === 'volunteer' 
          ? 'volunteer' 
          : 'citizen';

    const updatedUser: UserProfile = {
      ...user,
      role: mappedRole,
      governorate: extraDetails.governorate || user.governorate,
      city: extraDetails.city || user.city,
      neighborhood: extraDetails.neighborhood || user.neighborhood,
      fullName: extraDetails.fullName || user.fullName,
      updatedAt: new Date().toISOString()
    };

    let resp: ResponderProfile | null = null;
    let vol: VolunteerProfile | null = null;

    if (mappedRole === 'responder') {
      resp = {
        id: `resp_${Date.now()}`,
        userId: user.id,
        responderType: role === 'veterinarian' ? 'veterinarian' : 'association',
        verificationStatus: 'pending',
        name: extraDetails.orgName || extraDetails.clinicName || user.fullName,
        description: '',
        email: user.email || 'contact@hema.sy',
        phone: user.phone,
        governoratesServed: [extraDetails.governorate || user.governorate],
        citiesServed: [extraDetails.city || user.city],
        servicesOffered: extraDetails.servicesOffered || ['rescue'],
        availability: 'available',
        createdAt: new Date().toISOString()
      };
    } else if (mappedRole === 'volunteer') {
      vol = {
        id: `vol_${Date.now()}`,
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        governorate: extraDetails.governorate || user.governorate,
        city: extraDetails.city || user.city,
        roles: extraDetails.selectedRoles || ['transport'],
        availability: 'available',
        verificationStatus: 'active',
        totalAssistsCount: 0,
        createdAt: new Date().toISOString()
      };
      updatedUser.volunteerProfileId = vol.id;
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert({
        id: user.id,
        role: mappedRole,
        full_name: updatedUser.fullName,
        governorate: updatedUser.governorate,
        city: updatedUser.city,
        neighborhood: updatedUser.neighborhood
      });

      if (resp) {
        await supabase.from('responder_profiles').upsert({
          user_id: user.id,
          responder_type: resp.responderType,
          verification_status: 'pending',
          name: resp.name,
          description: '',
          email: resp.email,
          phone: resp.phone,
          governorates_served: resp.governoratesServed,
          cities_served: resp.citiesServed
        });
      } else if (vol) {
        await supabase.from('volunteer_profiles').upsert({
          user_id: user.id,
          full_name: vol.fullName,
          phone: vol.phone,
          email: vol.email,
          governorate: vol.governorate,
          city: vol.city,
          roles: vol.roles
        });
      }
    }

    saveAuth(updatedUser, resp, vol);
    setNeedsRoleSetup(false);
    return { success: true };
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    saveAuth(updated, responderProfile, volunteerProfile);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({
          full_name: updated.fullName,
          phone: updated.phone,
          governorate: updated.governorate,
          city: updated.city,
          neighborhood: updated.neighborhood,
          language_preference: updated.languagePreference,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      } catch (e) {
        console.warn('Failed to sync profile update to Supabase:', e);
      }
    }
  };

  // Compatibility adapters for existing code
  const loginAsCitizen = async (phone: string, name: string, governorate = 'damascus', city = 'دمشق') => {
    const citizenUser: UserProfile = {
      id: `usr_${Date.now()}`,
      role: 'citizen',
      phone: normalizePhoneNumber(phone),
      phoneVerified: true,
      fullName: name.trim(),
      governorate,
      city,
      neighborhood: '',
      languagePreference: 'ar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveAuth(citizenUser, null, null);
  };

  const loginAsResponder = async (responderId: string) => {
    const allResps = await dataService.getResponders();
    const found = allResps.find(r => r.id === responderId);
    if (!found) return;

    const responderUser: UserProfile = {
      id: found.userId,
      role: 'responder',
      phone: found.phone,
      phoneVerified: true,
      fullName: found.name,
      email: found.email,
      governorate: found.governoratesServed[0] || 'damascus',
      city: found.citiesServed[0] || 'دمشق',
      languagePreference: 'ar',
      createdAt: found.createdAt,
      updatedAt: found.createdAt
    };
    saveAuth(responderUser, found, null);
  };

  const registerAndLoginResponder = async (
    responderData: Omit<ResponderProfile, 'id' | 'createdAt' | 'verificationStatus'>
  ): Promise<ResponderProfile> => {
    const newResponder = await dataService.registerResponder(responderData);
    const responderUser: UserProfile = {
      id: newResponder.userId,
      role: 'responder',
      phone: newResponder.phone,
      phoneVerified: true,
      fullName: newResponder.name,
      email: newResponder.email,
      governorate: newResponder.governoratesServed[0] || 'damascus',
      city: newResponder.citiesServed[0] || 'دمشق',
      languagePreference: 'ar',
      createdAt: newResponder.createdAt,
      updatedAt: newResponder.createdAt
    };
    saveAuth(responderUser, newResponder, null);
    return newResponder;
  };

  const loginAsVolunteer = async (volunteerId: string) => {
    const found = dataService.getVolunteerById(volunteerId);
    if (!found) return;

    const volunteerUser: UserProfile = {
      id: found.userId,
      role: 'volunteer',
      phone: found.phone,
      phoneVerified: true,
      fullName: found.fullName,
      email: found.email,
      governorate: found.governorate,
      city: found.city,
      neighborhood: found.neighborhood,
      volunteerProfileId: found.id,
      languagePreference: 'ar',
      createdAt: found.createdAt,
      updatedAt: found.createdAt
    };
    saveAuth(volunteerUser, null, found);
  };

  const requestPhoneOtp = async (phone: string) => {
    return sendPasswordResetPhoneOtp(phone);
  };

  const verifyPhoneOtp = async (phone: string, code: string) => {
    return verifyPasswordResetOtp(phone, code);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        responderProfile,
        volunteerProfile,
        accountType,
        experience,
        isAuthenticated,
        isCitizen,
        isAssociation,
        isVeterinarian,
        isVolunteer,
        isResponder,
        isVerifiedResponder,
        isPendingResponder,
        needsRoleSetup,
        signIn,
        signUp,
        sendPasswordResetEmail,
        sendPasswordResetPhoneOtp,
        verifyPasswordResetOtp,
        completePasswordReset,
        completeAccountRoleSetup,
        logout,
        updateUserProfile,
        loginAsCitizen,
        loginAsResponder,
        registerAndLoginResponder,
        loginAsVolunteer,
        requestPhoneOtp,
        verifyPhoneOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
