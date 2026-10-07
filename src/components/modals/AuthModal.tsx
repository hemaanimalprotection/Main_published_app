import React, { useState, useEffect } from 'react';
import { useAuth, SignUpParams } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SYRIAN_GOVERNORATES, VolunteerRole, VOLUNTEER_ROLE_DEFINITIONS, UserRole, AccountType } from '../../types';
import { COUNTRIES, CountryInfo, isEmailAddress, normalizePhoneNumber } from '../../utils/countryData';
import { isSupabaseConfigured } from '../../services/supabase';
import { 
  X, 
  Phone, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck, 
  Building, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  HeartHandshake,
  Car,
  HeartPulse,
  Home,
  User,
  KeyRound,
  ChevronDown,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect?: (role?: UserRole, isPending?: boolean, accountType?: AccountType) => void;
  defaultMode?: 'citizen' | 'responder' | 'volunteer';
  initialView?: 'login' | 'register' | 'forgot_password';
  initialRegisterRole?: 'citizen' | 'association' | 'veterinarian' | 'volunteer';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccessRedirect,
  defaultMode = 'citizen',
  initialView = 'login',
  initialRegisterRole
}) => {
  const { 
    signIn, 
    signUp, 
    sendPasswordResetEmail, 
    sendPasswordResetPhoneOtp, 
    verifyPasswordResetOtp, 
    completePasswordReset,
    completeAccountRoleSetup,
    needsRoleSetup
  } = useAuth();
  
  const { t, isRtl, language } = useLanguage();
  const ArrowBack = isRtl ? ArrowRight : ArrowLeft;

  // Primary Modal View Modes:
  // 'login': The ONE single sign-in form for all user types
  // 'register': Choose intended usage role, then role-adapted registration
  // 'forgot_password': Password recovery via Email or Phone SMS
  // 'role_setup': Account setup screen when account has no valid role
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot_password' | 'role_setup'>('login');

  // Universal Sign-in State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration State - Choice of role only during registration
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'association' | 'veterinarian' | 'volunteer'>(
    initialRegisterRole || (defaultMode === 'volunteer' ? 'volunteer' : defaultMode === 'responder' ? 'association' : 'citizen')
  );
  const [regContactMethod, setRegContactMethod] = useState<'email' | 'phone'>('phone');
  const [regCountry, setRegCountry] = useState<CountryInfo>(COUNTRIES[0]); // Syria default
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('damascus');
  const [regCity, setRegCity] = useState('دمشق');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Association & Veterinarian Specific Registration Fields
  const [orgName, setOrgName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [servicesOffered, setServicesOffered] = useState<string[]>(['rescue', 'veterinary_care']);

  // Volunteer Specific Registration Fields
  const [selectedRoles, setSelectedRoles] = useState<VolunteerRole[]>(['transport', 'first_aid']);
  const [volHasVehicle, setVolHasVehicle] = useState(false);
  const [volVehicleType, setVolVehicleType] = useState('');
  const [volShelterNote, setVolShelterNote] = useState('');
  const [volOtherHelp, setVolOtherHelp] = useState('');
  const [volAvailability, setVolAvailability] = useState<'available' | 'emergency_on_call' | 'weekends_only' | 'busy'>('available');
  const [volExperience, setVolExperience] = useState('');

  // Password Recovery Flow State
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCountry, setRecoveryCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify_sms' | 'new_password' | 'done'>('request');
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [recoveryTimer, setRecoveryTimer] = useState(60);
  const [neutralConfirmationSent, setNeutralConfirmationSent] = useState(false);

  // Account Role Setup State (for accounts without a role)
  const [setupRole, setSetupRole] = useState<'citizen' | 'association' | 'veterinarian' | 'volunteer'>('citizen');
  const [setupFullName, setSetupFullName] = useState('');
  const [setupGovernorate, setSetupGovernorate] = useState('damascus');
  const [setupCity, setSetupCity] = useState('دمشق');
  const [setupOrgName, setSetupOrgName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Reset and synchronize on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessNotice(null);
      setNeutralConfirmationSent(false);

      if (needsRoleSetup) {
        setViewMode('role_setup');
      } else if (initialView === 'register') {
        setViewMode('register');
        if (initialRegisterRole) {
          setSelectedRole(initialRegisterRole);
        } else if (defaultMode === 'volunteer') {
          setSelectedRole('volunteer');
        } else if (defaultMode === 'responder') {
          setSelectedRole('association');
        } else {
          setSelectedRole('citizen');
        }
      } else if (initialView === 'forgot_password') {
        setViewMode('forgot_password');
        setRecoveryStep('request');
      } else {
        setViewMode('login');
      }
    }
  }, [isOpen, initialView, defaultMode, initialRegisterRole, needsRoleSetup]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (viewMode === 'forgot_password' && recoveryStep === 'verify_sms' && recoveryTimer > 0) {
      interval = setInterval(() => setRecoveryTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [viewMode, recoveryStep, recoveryTimer]);

  if (!isOpen) return null;

  // Toggle volunteer roles
  const handleVolunteerRoleToggle = (role: VolunteerRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        setErrorMessage('يرجى اختيار دور تطوعي واحد على الأقل.');
        return;
      }
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
      setErrorMessage(null);
    }
  };

  // Toggle responder services
  const handleServiceToggle = (srv: string) => {
    if (servicesOffered.includes(srv)) {
      if (servicesOffered.length === 1) return;
      setServicesOffered(servicesOffered.filter(s => s !== srv));
    } else {
      setServicesOffered([...servicesOffered, srv]);
    }
  };

  // 1. Handle Universal Single Sign-In Submission
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    setLoading(true);
    const result = await signIn(loginIdentifier, loginPassword);
    setLoading(false);

    if (result.success) {
      if (result.needsRoleSetup) {
        setViewMode('role_setup');
        return;
      }

      setSuccessNotice('تم تسجيل الدخول بنجاح! جاري توجيهك...');
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect) {
          onSuccessRedirect(result.role, result.isPending, result.accountType);
        }
      }, 700);
    } else {
      setErrorMessage(result.message || 'بيانات تسجيل الدخول غير صحيحة.');
    }
  };

  // 2. Handle Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage(t.passwordTooShort);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية.');
      return;
    }

    if (regContactMethod === 'email' && (!regEmail || !isEmailAddress(regEmail))) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (regContactMethod === 'phone' && !regPhone.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف.');
      return;
    }

    // Role-specific validation
    if (selectedRole === 'association' && !orgName.trim()) {
      setErrorMessage('يرجى إدخال اسم الجمعية أو الفريق التطوعي.');
      return;
    }

    if (selectedRole === 'veterinarian' && !clinicName.trim() && !regFullName.trim()) {
      setErrorMessage('يرجى إدخال اسم الطبيب أو العيادة البيطرية.');
      return;
    }

    if (selectedRole === 'volunteer' && selectedRoles.length === 0) {
      setErrorMessage('يرجى تحديد مجال تطوع واحد على الأقل.');
      return;
    }

    const fullPhoneNumber = regContactMethod === 'phone' 
      ? normalizePhoneNumber(regPhone, regCountry.dialCode)
      : undefined;

    const payload: SignUpParams = {
      role: selectedRole,
      contactMethod: regContactMethod,
      email: regContactMethod === 'email' ? regEmail.trim().toLowerCase() : undefined,
      phone: fullPhoneNumber,
      password: regPassword,
      fullName: regFullName.trim(),
      governorate: regGovernorate,
      city: regCity,
      neighborhood: regNeighborhood.trim() || undefined,
      orgName: orgName.trim() || undefined,
      contactPerson: contactPerson.trim() || regFullName.trim(),
      clinicName: clinicName.trim() || undefined,
      clinicAddress: clinicAddress.trim() || undefined,
      specialty: specialty.trim() || undefined,
      registrationNumber: licenseNumber.trim() || undefined,
      servicesOffered: servicesOffered,
      selectedRoles: selectedRole === 'volunteer' ? selectedRoles : undefined,
      hasVehicle: volHasVehicle,
      vehicleType: volVehicleType.trim() || undefined,
      shelterCapacityNote: volShelterNote.trim() || undefined,
      otherHelpDetails: volOtherHelp.trim() || undefined,
      availability: volAvailability,
      experienceNote: volExperience.trim() || undefined
    };

    setLoading(true);
    const result = await signUp(payload);
    setLoading(false);

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        setSuccessNotice('تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني والضغط على رابط التحقق لتفعيل حسابك.');
      } else if (result.requiresPhoneOtp) {
        setSuccessNotice('تم إرسال رمز التحقق إلى هاتفك. يرجى إدخال الرمز لتأكيد الحساب.');
      } else {
        const isPending = selectedRole === 'veterinarian';
        if (selectedRole === 'association') {
          setSuccessNotice('تم تسجيل وتفعيل حساب الجمعية بنجاح! جاري الانتقال إلى غرفة العمليات...');
        } else {
          setSuccessNotice('تم إنشاء حسابك وتوثيقه بنجاح!');
        }
        setTimeout(() => {
          onClose();
          if (onSuccessRedirect) {
            onSuccessRedirect(result.role, isPending, result.accountType || (selectedRole === 'association' ? 'association' : undefined));
          }
        }, 800);
      }
    } else {
      setErrorMessage(result.message || 'فشل إنشاء الحساب. يرجى التحقق من صحة البيانات والمحاولة مجدداً.');
    }
  };

  // 3. Handle Password Recovery: Step 1 (Send Email or SMS)
  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (recoveryMethod === 'email') {
      if (!recoveryEmail || !isEmailAddress(recoveryEmail)) {
        setLoading(false);
        setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
        return;
      }
      const res = await sendPasswordResetEmail(recoveryEmail);
      setLoading(false);
      if (res.success) {
        setNeutralConfirmationSent(true);
      } else {
        setErrorMessage(res.message || 'تعذر إرسال رابط الاستعادة.');
      }
    } else {
      // Phone SMS
      if (!recoveryPhone.trim()) {
        setLoading(false);
        setErrorMessage('يرجى إدخال رقم الهاتف.');
        return;
      }
      const fullPhone = normalizePhoneNumber(recoveryPhone, recoveryCountry.dialCode);
      const res = await sendPasswordResetPhoneOtp(fullPhone);
      setLoading(false);
      if (res.success) {
        setRecoveryStep('verify_sms');
        setRecoveryTimer(60);
      } else {
        setErrorMessage(res.message || 'تعذر إرسال رمز التحقق عبر SMS.');
      }
    }
  };

  // Handle Verify SMS Recovery Code
  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recoveryOtpCode || recoveryOtpCode.trim().length < 4) {
      setErrorMessage(t.enterSmsCode);
      return;
    }

    setLoading(true);
    const fullPhone = normalizePhoneNumber(recoveryPhone, recoveryCountry.dialCode);
    const res = await verifyPasswordResetOtp(fullPhone, recoveryOtpCode);
    setLoading(false);

    if (res.success) {
      setRecoveryStep('new_password');
    } else {
      setErrorMessage(res.message || t.expiredOrInvalidCode);
    }
  };

  // Handle Complete New Password Reset
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (recoveryNewPassword.length < 6) {
      setErrorMessage(t.passwordTooShort);
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    const res = await completePasswordReset(recoveryNewPassword);
    setLoading(false);

    if (res.success) {
      setRecoveryStep('done');
    } else {
      setErrorMessage(res.message || 'فشل تحديث كلمة المرور.');
    }
  };

  // 4. Handle Account Role Setup (when account exists with no valid role)
  const handleRoleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await completeAccountRoleSetup(setupRole, {
      fullName: setupFullName.trim(),
      governorate: setupGovernorate,
      city: setupCity,
      orgName: setupOrgName.trim()
    });
    setLoading(false);

    if (res.success) {
      setSuccessNotice('تم حفظ دور الحساب بنجاح!');
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect) {
          const role = setupRole === 'association' || setupRole === 'veterinarian' ? 'responder' : setupRole;
          onSuccessRedirect(role as UserRole, setupRole === 'association' || setupRole === 'veterinarian', setupRole as AccountType);
        }
      }, 700);
    } else {
      setErrorMessage(res.message || 'فشل إكمال إعداد الحساب.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E5E1D8] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-[#F5F2ED] flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] flex items-center justify-center font-bold shrink-0">
              {viewMode === 'forgot_password' ? (
                <KeyRound className="w-5 h-5 text-[#D4A373]" />
              ) : viewMode === 'role_setup' ? (
                <User className="w-5 h-5 text-[#D4A373]" />
              ) : viewMode === 'register' ? (
                <ShieldCheck className="w-5 h-5 text-[#D4A373]" />
              ) : (
                <Lock className="w-5 h-5 text-[#D4A373]" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#5B4D3F]">
                {viewMode === 'forgot_password'
                  ? t.recoveryTitle
                  : viewMode === 'role_setup'
                    ? t.accountSetupTitle
                    : viewMode === 'register'
                      ? t.registerTab
                      : t.authModalTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#7A7167]">
                {viewMode === 'forgot_password'
                  ? t.recoverySubtitle
                  : viewMode === 'role_setup'
                    ? t.accountSetupSubtitle
                    : viewMode === 'register'
                      ? t.registerRoleSelectSubtitle
                      : t.authModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] flex items-center justify-center transition shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Tab Switcher (Visible in login & register views) */}
        {(viewMode === 'login' || viewMode === 'register') && (
          <div className="px-4 sm:px-6 pt-3 sm:pt-4">
            <div className="p-1 bg-[#F5F2ED] rounded-xl flex gap-1 border border-[#E5E1D8]">
              <button
                type="button"
                onClick={() => { setViewMode('login'); setErrorMessage(null); setSuccessNotice(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 min-h-[38px] ${
                  viewMode === 'login' ? 'bg-white text-[#5B4D3F] shadow-xs' : 'text-[#7A7167] hover:text-[#5B4D3F]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.loginTab}</span>
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('register'); setErrorMessage(null); setSuccessNotice(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 min-h-[38px] ${
                  viewMode === 'register' ? 'bg-white text-[#5B4D3F] shadow-xs' : 'text-[#7A7167] hover:text-[#5B4D3F]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.registerTab}</span>
              </button>
            </div>
          </div>
        )}

        {/* Supabase status notice if unconfigured in environment */}
        {!isSupabaseConfigured && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">مزود المصادقة Supabase بانتظار الإعداد</p>
              <p className="text-[11px] text-amber-800">
                {t.supabaseNotConfiguredNotice}
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Feedback Banners */}
        <div className="px-4 sm:px-6 pt-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] sm:max-h-[72vh] overflow-y-auto">

          {/* ========================================================= */}
          {/* VIEW 1: UNIVERSAL SINGLE SIGN-IN (FOR ALL USER TYPES)     */}
          {/* ========================================================= */}
          {viewMode === 'login' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {/* Email or Phone field */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1.5">
                  {t.identifierLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={t.identifierPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] text-[#2D2D2D]"
                    dir="auto"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400">
                    {isEmailAddress(loginIdentifier) ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-[#7A7167] mt-1">
                  {t.identifierHint}
                </p>
              </div>

              {/* Password field with Show/Hide toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#5B4D3F]">
                    {t.passwordLabel} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot_password'); setErrorMessage(null); setRecoveryStep('request'); }}
                    className="text-[11px] font-bold text-[#D4A373] hover:underline"
                  >
                    {t.forgotPasswordLink}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] text-[#2D2D2D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-stone-400 hover:text-[#5B4D3F]"
                    title={showLoginPassword ? t.hidePassword : t.showPassword}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t.btnSignIn}</span>
                  </>
                )}
              </button>

              {/* Link to create account */}
              <div className="pt-2 text-center border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => { setViewMode('register'); setErrorMessage(null); }}
                  className="text-xs font-bold text-[#5B4D3F] hover:text-[#D4A373] transition"
                >
                  {t.createAccountLink}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: REGISTRATION (CHOOSE USER TYPE ONLY HERE)         */}
          {/* ========================================================= */}
          {viewMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1.5">
                  {t.registerRoleSelectTitle} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Citizen */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('citizen')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2.5 ${
                      selectedRole === 'citizen'
                        ? 'border-[#5B4D3F] bg-[#FAF8F5] ring-1 ring-[#5B4D3F]'
                        : 'border-[#E5E1D8] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleCitizenTitle}</p>
                      <p className="text-[10px] text-[#7A7167] line-clamp-1">{t.roleCitizenDesc}</p>
                    </div>
                  </button>

                  {/* Association */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('association')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2.5 ${
                      selectedRole === 'association'
                        ? 'border-[#D4A373] bg-[#FDF9F3] ring-1 ring-[#D4A373]'
                        : 'border-[#E5E1D8] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleAssociationTitle}</p>
                      <p className="text-[10px] text-[#7A7167] line-clamp-1">{t.roleAssociationDesc}</p>
                    </div>
                  </button>

                  {/* Veterinarian */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('veterinarian')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2.5 ${
                      selectedRole === 'veterinarian'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-[#E5E1D8] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleVetTitle}</p>
                      <p className="text-[10px] text-[#7A7167] line-clamp-1">{t.roleVetDesc}</p>
                    </div>
                  </button>

                  {/* Volunteer */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('volunteer')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2.5 ${
                      selectedRole === 'volunteer'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-[#E5E1D8] hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleVolunteerTitle}</p>
                      <p className="text-[10px] text-[#7A7167] line-clamp-1">{t.roleVolunteerDesc}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pending Approval Notice for Responders */}
              {(selectedRole === 'association' || selectedRole === 'veterinarian') && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">{t.associationPendingAlert}</p>
                </div>
              )}

              {/* Contact Method Selector (Email vs Phone) */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1.5">
                  {t.contactMethodLabel} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRegContactMethod('phone')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      regContactMethod === 'phone'
                        ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                        : 'bg-white text-[#7A7167] border-[#E5E1D8] hover:text-[#5B4D3F]'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.methodPhone}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegContactMethod('email')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      regContactMethod === 'email'
                        ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                        : 'bg-white text-[#7A7167] border-[#E5E1D8] hover:text-[#5B4D3F]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t.methodEmail}</span>
                  </button>
                </div>
              </div>

              {/* Contact Method Inputs: Phone with Country Selector OR Email */}
              {regContactMethod === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    {t.methodPhone} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    {/* Country Selector */}
                    <div className="relative shrink-0">
                      <select
                        value={regCountry.code}
                        onChange={(e) => {
                          const found = COUNTRIES.find(c => c.code === e.target.value);
                          if (found) setRegCountry(found);
                        }}
                        className="h-full px-2.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#F9F7F2] text-xs font-mono font-bold text-[#5B4D3F] focus:outline-none"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dialCode} ({c.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={regCountry.formatPlaceholder}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D] font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    {t.methodEmail} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                  {selectedRole === 'association' ? t.contactPersonLabel : t.fullNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    {t.passwordLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="٦ خانات على الأقل"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 left-2.5 flex items-center text-stone-400"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    {t.confirmPasswordLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                  />
                </div>
              </div>

              {/* Governorate and City */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المحافظة *</label>
                  <select
                    value={regGovernorate}
                    onChange={(e) => {
                      setRegGovernorate(e.target.value);
                      const gov = SYRIAN_GOVERNORATES.find(g => g.id === e.target.value);
                      if (gov && gov.majorCities[0]) {
                        setRegCity(gov.majorCities[0].nameAr);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none bg-white text-[#2D2D2D]"
                  >
                    {SYRIAN_GOVERNORATES.map(gov => (
                      <option key={gov.id} value={gov.id}>
                        {language === 'fr' ? gov.nameFr : gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المدينة / المنطقة *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="دمشق، المزة..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none text-[#2D2D2D]"
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {selectedRole === 'association' && (
                <div className="space-y-3 p-3 rounded-2xl bg-[#FBF9F5] border border-[#E5E1D8]">
                  <p className="text-xs font-bold text-[#5B4D3F] border-b border-[#E5E1D8] pb-1.5">بيانات الجمعية أو الفريق</p>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">اسم الجمعية أو الفريق *</label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="جمعية حماية الحيوان في دمشق"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">رقم الإشهار أو الترخيص (إن وجد)</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="رقم القرار أو التسجيل"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1.5">الخدمات المتاحة:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'rescue', label: 'إنقاذ ميداني' },
                        { id: 'shelter', label: 'مأوى وإيواء' },
                        { id: 'foster', label: 'استضافة مؤقتة' },
                        { id: 'veterinary_care', label: 'علاج بيطري' },
                        { id: 'transport', label: 'نقل وإسعاف' }
                      ].map(srv => (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => handleServiceToggle(srv.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            servicesOffered.includes(srv.id)
                              ? 'bg-[#5B4D3F] text-white'
                              : 'bg-white border border-[#E5E1D8] text-[#7A7167]'
                          }`}
                        >
                          {srv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'veterinarian' && (
                <div className="space-y-3 p-3 rounded-2xl bg-[#FBF9F5] border border-[#E5E1D8]">
                  <p className="text-xs font-bold text-[#5B4D3F] border-b border-[#E5E1D8] pb-1.5">بيانات العيادة والترخيص البيطري</p>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">اسم العيادة أو المشفى البيطري</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="عيادة الشفاء البيطرية"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">رقم الانتساب لنقابة الأطباء البيطريين</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="رقم القيد النقابي"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">عنوان العيادة</label>
                    <input
                      type="text"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="الشارع، البناء، علامة فارقة"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'volunteer' && (
                <div className="space-y-3 p-3 rounded-2xl bg-[#FBF9F5] border border-[#E5E1D8]">
                  <p className="text-xs font-bold text-[#5B4D3F] border-b border-[#E5E1D8] pb-1.5">مجالات التطوع والمساعدة الميدانية</p>
                  <div className="space-y-2">
                    {(Object.keys(VOLUNTEER_ROLE_DEFINITIONS) as VolunteerRole[]).map(roleKey => {
                      const def = VOLUNTEER_ROLE_DEFINITIONS[roleKey];
                      const isChecked = selectedRoles.includes(roleKey);
                      return (
                        <div
                          key={roleKey}
                          onClick={() => handleVolunteerRoleToggle(roleKey)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isChecked ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/60 border-[#E5E1D8]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-[#5B4D3F]">{def.labelAr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedRoles.includes('transport') && (
                    <div className="p-2.5 bg-white rounded-xl border border-blue-200 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-blue-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={volHasVehicle}
                          onChange={(e) => setVolHasVehicle(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>أمتلك وسيلة نقل مناسبة للإسعاف أو النقل</span>
                      </label>
                      {volHasVehicle && (
                        <input
                          type="text"
                          value={volVehicleType}
                          onChange={(e) => setVolVehicleType(e.target.value)}
                          placeholder="نوع المركبة (سيارة خاصة، دراجة، فان...)"
                          className="w-full px-3 py-1.5 rounded-lg border border-blue-200 text-xs text-[#2D2D2D]"
                        />
                      )}
                    </div>
                  )}

                  {selectedRoles.includes('temporary_shelter') && (
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">تفاصيل إمكانية الاستضافة المؤقتة (Foster)</label>
                      <input
                        type="text"
                        value={volShelterNote}
                        onChange={(e) => setVolShelterNote(e.target.value)}
                        placeholder="مكان دافئ، غرفة مخصصة، إمكانية استضافة قطط أو جراء..."
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs text-[#2D2D2D]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Terms agreement */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="regAgreed"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded text-[#5B4D3F] focus:ring-[#D4A373] mt-0.5"
                />
                <label htmlFor="regAgreed" className="text-[11px] text-[#7A7167] cursor-pointer leading-tight">
                  {t.termsAgreement}
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.btnCreateAccount}</span>
                  </>
                )}
              </button>

              {/* Back to sign in */}
              <div className="pt-2 text-center border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => { setViewMode('login'); setErrorMessage(null); }}
                  className="text-xs font-bold text-[#5B4D3F] hover:text-[#D4A373] transition"
                >
                  {t.alreadyHaveAccount}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: PASSWORD RECOVERY (FORGOT PASSWORD FLOW)          */}
          {/* ========================================================= */}
          {viewMode === 'forgot_password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setViewMode('login'); setErrorMessage(null); setNeutralConfirmationSent(false); }}
                className="text-xs font-bold text-[#7A7167] hover:text-[#5B4D3F] flex items-center gap-1 transition"
              >
                <ArrowBack className="w-3.5 h-3.5" />
                <span>{t.btnBackToSignIn}</span>
              </button>

              {/* Step A: Request recovery link/SMS */}
              {recoveryStep === 'request' && (
                <>
                  {!neutralConfirmationSent ? (
                    <form onSubmit={handleSendRecovery} className="space-y-4">
                      {/* Method selector */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('email')}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            recoveryMethod === 'email'
                              ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                              : 'bg-white text-[#7A7167] border-[#E5E1D8]'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{t.recoveryMethodEmail}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('phone')}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            recoveryMethod === 'phone'
                              ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                              : 'bg-white text-[#7A7167] border-[#E5E1D8]'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t.recoveryMethodPhone}</span>
                        </button>
                      </div>

                      {recoveryMethod === 'email' ? (
                        <div>
                          <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                            {t.methodEmail} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                            dir="ltr"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                            {t.methodPhone} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={recoveryCountry.code}
                              onChange={(e) => {
                                const found = COUNTRIES.find(c => c.code === e.target.value);
                                if (found) setRecoveryCountry(found);
                              }}
                              className="px-2.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#F9F7F2] text-xs font-mono font-bold text-[#5B4D3F] focus:outline-none"
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              required
                              value={recoveryPhone}
                              onChange={(e) => setRecoveryPhone(e.target.value)}
                              placeholder={recoveryCountry.formatPlaceholder}
                              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D] font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span>{recoveryMethod === 'email' ? t.btnSendRecoveryEmail : t.btnSendRecoverySms}</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Neutral Confirmation Notice */
                    <div className="text-center space-y-4 py-4">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-[#5B4D3F]">
                        {t.recoveryEmailSentNeutral}
                      </h4>
                      <p className="text-xs text-[#7A7167] max-w-xs mx-auto leading-relaxed">
                        يرجى تفقد بريدك الوارد (ومجلد الرسائل غير المرغوب فيها) واتباع التعليمات لتعيين كلمة مرور جديدة.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setViewMode('login'); setNeutralConfirmationSent(false); }}
                        className="px-6 py-2.5 rounded-xl bg-[#5B4D3F] text-white text-xs font-bold transition"
                      >
                        {t.btnBackToSignIn}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Step B: Verify SMS OTP */}
              {recoveryStep === 'verify_sms' && (
                <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                    {t.recoverySmsSentNeutral}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                      {t.enterSmsCode} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryOtpCode}
                      onChange={(e) => setRecoveryOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-3 rounded-xl border border-[#E5E1D8] text-center font-mono text-lg tracking-widest focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                      dir="ltr"
                    />
                  </div>

                  {/* Countdown Timer and Resend button */}
                  <div className="flex items-center justify-between text-xs text-[#7A7167]">
                    <span>
                      {recoveryTimer > 0 ? (
                        <>متبقي: {recoveryTimer} ثانية</>
                      ) : (
                        <span className="text-red-600 font-bold">انتهت صلاحية الرمز</span>
                      )}
                    </span>
                    {recoveryTimer === 0 && (
                      <button
                        type="button"
                        onClick={handleSendRecovery}
                        className="text-xs font-bold text-[#D4A373] hover:underline"
                      >
                        {t.resendCode}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>التحقق ومتابعة</span>
                    )}
                  </button>
                </form>
              )}

              {/* Step C: Set New Password */}
              {recoveryStep === 'new_password' && (
                <form onSubmit={handleSaveNewPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                      {t.newPasswordLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryPassword ? 'text' : 'password'}
                        required
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="٦ خانات على الأقل"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                        className="absolute inset-y-0 left-3 flex items-center text-stone-400"
                      >
                        {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                      {t.confirmPasswordLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showRecoveryPassword ? 'text' : 'password'}
                      required
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#D4A373] text-[#2D2D2D]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>{t.btnSaveNewPassword}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Step D: Done */}
              {recoveryStep === 'done' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[#5B4D3F]">
                    {t.passwordResetSuccess}
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setViewMode('login'); setRecoveryStep('request'); }}
                    className="px-6 py-2.5 rounded-xl bg-[#5B4D3F] text-white text-xs font-bold transition"
                  >
                    {t.btnBackToSignIn}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: ACCOUNT ROLE SETUP (ACCOUNTS WITHOUT VALID ROLE)  */}
          {/* ========================================================= */}
          {viewMode === 'role_setup' && (
            <form onSubmit={handleRoleSetupSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                {t.accountSetupSubtitle}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1.5">
                  نوع الاستخدام المطلوب:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupRole('citizen')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2 ${
                      setupRole === 'citizen' ? 'border-[#5B4D3F] bg-[#FAF8F5] ring-1 ring-[#5B4D3F]' : 'border-[#E5E1D8] bg-white'
                    }`}
                  >
                    <User className="w-4 h-4 mt-0.5 text-stone-700" />
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleCitizenTitle}</p>
                      <p className="text-[10px] text-[#7A7167]">مواطن / بلاغات وتبني</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupRole('volunteer')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2 ${
                      setupRole === 'volunteer' ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600' : 'border-[#E5E1D8] bg-white'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 mt-0.5 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleVolunteerTitle}</p>
                      <p className="text-[10px] text-[#7A7167]">متطوع ميداني</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupRole('association')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2 ${
                      setupRole === 'association' ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600' : 'border-[#E5E1D8] bg-white'
                    }`}
                  >
                    <Building className="w-4 h-4 mt-0.5 text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleAssociationTitle}</p>
                      <p className="text-[10px] text-[#7A7167]">جمعية حماية</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupRole('veterinarian')}
                    className={`p-3 rounded-xl border text-right transition flex items-start gap-2 ${
                      setupRole === 'veterinarian' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-[#E5E1D8] bg-white'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mt-0.5 text-blue-700" />
                    <div>
                      <p className="text-xs font-bold text-[#5B4D3F]">{t.roleVetTitle}</p>
                      <p className="text-[10px] text-[#7A7167]">طبيب بيطري</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                  الاسم الكامل أو اسم الجهة:
                </label>
                <input
                  type="text"
                  required
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none text-[#2D2D2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المحافظة</label>
                  <select
                    value={setupGovernorate}
                    onChange={(e) => setSetupGovernorate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-white text-[#2D2D2D]"
                  >
                    {SYRIAN_GOVERNORATES.map(gov => (
                      <option key={gov.id} value={gov.id}>
                        {language === 'fr' ? gov.nameFr : gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المدينة</label>
                  <input
                    type="text"
                    required
                    value={setupCity}
                    onChange={(e) => setSetupCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>{t.btnCompleteSetup}</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
