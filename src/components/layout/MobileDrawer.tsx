import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Heart, 
  ShieldAlert, 
  MapPin, 
  FileText, 
  User, 
  Bell, 
  Globe, 
  LogOut, 
  X, 
  Building,
  Stethoscope,
  HeartHandshake,
  PlusCircle,
  Database,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'citizen' | 'responder' | 'volunteer') => void;
  onOpenNotifications: () => void;
  onOpenSqlModal?: () => void;
  unreadNotificationsCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
  onOpenSqlModal,
  unreadNotificationsCount
}) => {
  const { user, responderProfile, experience, isAuthenticated, isVerifiedResponder, isAssociation, isPendingResponder, isVolunteer, logout } = useAuth();
  const { language, t, isRtl, toggleLanguage } = useLanguage();

  const isExpertOrResponder = isVerifiedResponder || isAssociation;

  const handleNav = (view: string, param?: string) => {
    onNavigate(view, param);
    onClose();
  };

  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-[85%] max-w-[340px] bg-[#FDFCF9] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen 
            ? 'translate-x-0' 
            : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-white border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#D4A373] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs">
              H
            </div>
            <div>
              <span className="text-sm font-bold text-[#5B4D3F] block leading-tight">حِمى | Hema</span>
              <span className="text-[10px] text-[#A0988E]">القائمة الرئيسية المتكاملة</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher in Header */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg bg-[#F5F2ED] text-[11px] font-bold text-[#5B4D3F] flex items-center gap-1 hover:bg-[#E5E1D8] transition"
              title="تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'FR' : 'عربي'}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-[#F5F2ED] hover:text-[#5B4D3F] transition"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Card / Auth State */}
        <div className="p-3.5 bg-[#F9F7F2] border-b border-[#E5E1D8]">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#5B4D3F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.fullName?.charAt(0) || 'م'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#5B4D3F]">{user?.fullName}</h4>
                    <p className="text-[10px] text-[#7A7167] font-mono" dir="ltr">{user?.phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onOpenNotifications();
                    onClose();
                  }}
                  className="relative p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#5B4D3F] shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Role badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-[#E5E1D8] text-[10px] font-bold text-[#5B4D3F]">
                {isVolunteer ? (
                  <span className="text-emerald-800 flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3 text-emerald-600" />
                    متطوع ميداني معتمد
                  </span>
                ) : isExpertOrResponder ? (
                  <span className="text-[#D4A373] flex items-center gap-1">
                    {responderProfile?.responderType === 'association' ? <Building className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                    {responderProfile?.responderType === 'association' ? 'جمعية رعاية معتمدة' : 'طبيب بيطري معتمد'}
                  </span>
                ) : (
                  <span className="text-[#5B4D3F] flex items-center gap-1">
                    <User className="w-3 h-3 text-[#D4A373]" />
                    حساب مواطن
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] text-[#7A7167] font-medium">سجل الدخول لمتابعة بلاغاتك أو إدارة طلبات التبني والمهام:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('citizen');
                    onClose();
                  }}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold transition text-center shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('volunteer');
                    onClose();
                  }}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition text-center active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>انضم كمتطوع</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Section 1: Emergency & Core */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#A0988E] uppercase tracking-wider px-2 block">
              الخدمات الأساسية
            </span>

            {/* Emergency CTA */}
            <button
              onClick={() => handleNav('report_wizard')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                currentView === 'report_wizard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className={`w-4 h-4 ${currentView === 'report_wizard' ? 'text-white' : 'text-red-600 animate-pulse'}`} />
                <span>{t.btnReportEmergency}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-700/20 text-red-900 font-mono">طوارئ</span>
            </button>

            {/* Home */}
            <button
              onClick={() => handleNav('home')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                currentView === 'home'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'text-[#5B4D3F] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#D4A373]" />
                <span>{t.navHome}</span>
              </div>
              <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
            </button>

            {/* Adoptions */}
            <button
              onClick={() => handleNav('adoptions')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                currentView === 'adoptions'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'text-[#5B4D3F] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{t.navAdoptions}</span>
              </div>
              <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
            </button>

            {/* Publish Adoption */}
            <button
              onClick={() => handleNav('publish_adoption')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                currentView === 'publish_adoption'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'text-[#5B4D3F] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-[#D4A373]" />
                <span>عرض حيوان للتبني</span>
              </div>
              <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>

          {/* Section 2: Roles & Workspaces */}
          <div className="space-y-1 border-t border-[#E5E1D8] pt-3">
            <span className="text-[10px] font-bold text-[#A0988E] uppercase tracking-wider px-2 block">
              الأنشطة وغرف العمليات
            </span>

            {/* My Reports (Citizens only, not associations) */}
            {isAuthenticated && !isAssociation && !isExpertOrResponder && user?.role === 'citizen' && (
              <button
                onClick={() => handleNav('my_reports')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                  currentView === 'my_reports'
                    ? 'bg-[#5B4D3F] text-white shadow-xs'
                    : 'text-[#5B4D3F] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#D4A373]" />
                  <span>{t.navMyReports}</span>
                </div>
                <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}

            {/* My Adoptions (Accessible to all registered users, including Associations) */}
            {isAuthenticated && (
              <button
                onClick={() => handleNav('my_adoptions')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                  currentView === 'my_adoptions'
                    ? 'bg-[#5B4D3F] text-white shadow-xs'
                    : 'text-[#5B4D3F] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{t.navMyAdoptions}</span>
                </div>
                <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}

            {/* Volunteer Dashboard (Volunteers) */}
            {isAuthenticated && user?.role === 'volunteer' && (
              <button
                onClick={() => handleNav('volunteer_dashboard')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                  currentView === 'volunteer_dashboard'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>لوحة مهامي التطوعية</span>
                </div>
                <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}

            {/* Operational Workspace (Associations & Vets) */}
            {isExpertOrResponder && (
              <button
                onClick={() => handleNav('operational_workspace')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                  currentView === 'operational_workspace'
                    ? 'bg-[#5B4D3F] text-white shadow-xs'
                    : 'bg-[#F5F2ED] text-[#5B4D3F] hover:bg-[#E5E1D8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>غرفة العمليات الوطنية</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">معتمد</span>
              </button>
            )}

            {/* Register as Responder */}
            {!isExpertOrResponder && (
              <button
                onClick={() => {
                  onOpenAuth('responder');
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl text-xs font-semibold text-[#7A7167] hover:bg-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-[#A0988E]" />
                  <span>تسجيل جهة أو عيادة بيطرية</span>
                </div>
                <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}
          </div>

          {/* Privacy & Legal */}
          <div className="border-t border-[#E5E1D8] pt-3 space-y-1 text-xs text-[#7A7167]">
            <button
              onClick={() => handleNav('privacy')}
              className="w-full text-right p-2 rounded-lg hover:bg-white flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>سياسة الخصوصية والأمان</span>
              </div>
              <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
            </button>

            {onOpenSqlModal && (
              <button
                onClick={() => { onOpenSqlModal(); onClose(); }}
                className="w-full text-right p-2 rounded-lg hover:bg-white flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>Supabase SQL Schema</span>
                </div>
                <ArrowIcon className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer / Sign Out */}
        {isAuthenticated && (
          <div className="p-3 bg-white border-t border-[#E5E1D8]">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.navSignOut}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
