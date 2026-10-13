import React, { useState } from 'react';
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
  Menu, 
  X, 
  Building,
  Stethoscope,
  ChevronDown,
  HeartHandshake
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
  onOpenVolunteerRegister?: () => void;
  onOpenNotifications: () => void;
  onOpenSqlModal?: () => void;
  onOpenMobileDrawer?: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenVolunteerRegister,
  onOpenNotifications,
  onOpenMobileDrawer,
  unreadNotificationsCount,
}) => {
  const { 
    user, 
    responderProfile, 
    volunteerProfile, 
    experience, 
    isAuthenticated, 
    isVerifiedResponder, 
    isPendingResponder, 
    isVolunteer, 
    isAssociation,
    logout 
  } = useAuth();
  const { language, t, isRtl, toggleLanguage } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Check if current user is an authorized responder/expert (associations & verified vets ONLY)
  const isExpertOrResponder = isVerifiedResponder || isAssociation || (user?.role === 'responder' && user?.responderStatus === 'approved');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E1D8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.5rem] py-3">
          {/* Brand Logo with generous vertical spacing and no text overflow */}
          <div 
            className="flex items-center gap-3 cursor-pointer py-1 select-none shrink-0" 
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-[#D4A373] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
              H
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#5B4D3F] leading-tight">
                حِمى | Hema
              </span>
              <span className="text-[11px] text-[#A0988E] hidden sm:block leading-normal mt-0.5 max-w-[280px] lg:max-w-none truncate font-medium">
                المنصة الوطنية للتبليغ وتوثيق الانتهاكات بحق الحيوان في سوريا
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Simplified, Clean & Role-Discipline */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#7A7167]">
            {/* 1. الرئيسية */}
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors py-1 ${
                currentView === 'home' 
                  ? 'text-[#D4A373] border-b-2 border-[#D4A373] font-bold' 
                  : 'hover:text-[#5B4D3F]'
              }`}
            >
              {t.navHome}
            </button>

            {/* 2. تبني الحيوانات */}
            <button
              onClick={() => onNavigate('adoptions')}
              className={`transition-colors py-1 flex items-center gap-1.5 ${
                currentView === 'adoptions' 
                  ? 'text-[#D4A373] border-b-2 border-[#D4A373] font-bold' 
                  : 'hover:text-[#5B4D3F]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.navAdoptions}</span>
            </button>

            {/* 3. Citizen's Reports (Only for regular citizens) */}
            {isAuthenticated && !isAssociation && !isExpertOrResponder && user?.role === 'citizen' && (
              <button
                onClick={() => onNavigate('my_reports')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  currentView === 'my_reports' 
                    ? 'text-[#D4A373] border-b-2 border-[#D4A373] font-bold' 
                    : 'hover:text-[#5B4D3F]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>{t.navMyReports}</span>
              </button>
            )}

            {/* 4. Volunteer's Missions Dashboard (Only for Volunteers) */}
            {isAuthenticated && user?.role === 'volunteer' && (
              <button
                onClick={() => onNavigate('volunteer_dashboard')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  currentView === 'volunteer_dashboard' 
                    ? 'text-emerald-700 border-b-2 border-emerald-600 font-bold' 
                    : 'text-emerald-800 hover:text-emerald-950 font-bold'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>مهامي التطوعية</span>
              </button>
            )}

            {/* 5. Operations Room (Workspace) - for associations & verified responders */}
            {(isAssociation || isExpertOrResponder) && (
              <button
                onClick={() => onNavigate('operational_workspace')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  currentView === 'operational_workspace' 
                    ? 'text-[#D4A373] border-b-2 border-[#D4A373] font-bold' 
                    : 'hover:text-[#5B4D3F]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                <span>غرفة العمليات</span>
              </button>
            )}

            {isPendingResponder && (
              <button
                onClick={() => onNavigate('responder_pending')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200"
              >
                ⏳ {t.pendingBadge}
              </button>
            )}
          </nav>

          {/* Desktop Right Action Icons & Controls */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher - Compact & Clean */}
            <div className="flex bg-[#F5F2ED] rounded-full p-0.5 border border-[#E5E1D8]">
              <button
                onClick={() => language !== 'ar' && toggleLanguage()}
                className={`px-2 py-0.5 text-[11px] rounded-full transition font-medium ${
                  language === 'ar' 
                    ? 'bg-white text-[#5B4D3F] font-bold shadow-xs' 
                    : 'text-[#7A7167] hover:text-[#5B4D3F]'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => language !== 'fr' && toggleLanguage()}
                className={`px-2 py-0.5 text-[11px] rounded-full transition font-medium ${
                  language === 'fr' 
                    ? 'bg-white text-[#5B4D3F] font-bold shadow-xs' 
                    : 'text-[#7A7167] hover:text-[#5B4D3F]'
                }`}
              >
                FR
              </button>
            </div>

            {/* Volunteer Join Shortcut (if visitor) */}
            {!isAuthenticated && onOpenVolunteerRegister && (
              <button
                onClick={onOpenVolunteerRegister}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                <span>انضم كمتطوع</span>
              </button>
            )}

            {/* Emergency Report CTA */}
            <button
              onClick={() => onNavigate('report_wizard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition transform active:scale-95 shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.btnReportEmergency}</span>
            </button>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-[#7A7167] hover:text-[#5B4D3F] hover:bg-[#F5F2ED] transition"
                title={t.navNotifications}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Sign In */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 border-l border-[#E5E1D8] pl-2 sm:pl-3 py-1 transition"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-[#5B4D3F] leading-tight">{user?.fullName}</p>
                    <p className="text-[10px] text-[#A0988E] font-medium">
                      {isVolunteer
                        ? 'متطوع ميداني'
                        : isAssociation
                          ? 'جمعية حماية الحيوان'
                          : isExpertOrResponder 
                            ? (responderProfile?.responderType === 'veterinarian' ? 'طبيب بيطري معتمد' : 'جمعية معتمدة')
                            : 'مواطن مسجل'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F5F2ED] border border-[#E5E1D8] shadow-xs overflow-hidden flex items-center justify-center font-bold text-xs text-[#5B4D3F]">
                    {user?.fullName?.charAt(0) || 'م'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A0988E]" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div 
                    className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E5E1D8] py-2 z-50`}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#F5F2ED]">
                      <p className="text-xs font-bold text-[#5B4D3F]">{user?.fullName}</p>
                      <p className="text-[11px] text-[#7A7167] font-mono">{user?.phone || user?.email}</p>
                      {isAssociation && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          🏛️ جمعية حماية الحيوان
                        </span>
                      )}
                    </div>

                    {/* Operations Room for Associations & Responders */}
                    {(isAssociation || isExpertOrResponder) && (
                      <button
                        onClick={() => onNavigate('operational_workspace')}
                        className="w-full text-right px-4 py-2.5 text-xs text-[#5B4D3F] bg-[#FAF8F5] font-bold hover:bg-[#F3EFEA] flex items-center gap-2 border-b border-[#F5F2ED]"
                      >
                        <MapPin className="w-4 h-4 text-red-600 animate-pulse" />
                        <span>غرفة العمليات وخريطة الطوارئ</span>
                      </button>
                    )}

                    {/* Citizen Reports (for citizen accounts only) */}
                    {user?.role === 'citizen' && !isAssociation && !isExpertOrResponder && (
                      <button
                        onClick={() => onNavigate('my_reports')}
                        className="w-full text-right px-4 py-2 text-xs text-[#2D2D2D] hover:bg-[#F9F7F2] flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-[#D4A373]" />
                        {t.navMyReports}
                      </button>
                    )}

                    {/* Adoption section accessible to all registered users */}
                    <button
                      onClick={() => onNavigate('my_adoptions')}
                      className="w-full text-right px-4 py-2 text-xs text-[#2D2D2D] hover:bg-[#F9F7F2] flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>{t.navMyAdoptions}</span>
                    </button>

                    {user?.role === 'volunteer' && (
                      <button
                        onClick={() => onNavigate('volunteer_dashboard')}
                        className="w-full text-right px-4 py-2 text-xs text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 font-bold"
                      >
                        <HeartHandshake className="w-4 h-4 text-emerald-600" />
                        <span>لوحة المتطوع والمهام</span>
                      </button>
                    )}

                    <div className="border-t border-[#F5F2ED] my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.navSignOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white font-bold text-xs shadow-xs transition shrink-0"
              >
                {t.navSignIn}
              </button>
            )}
          </div>

          {/* Mobile Header: Replace desktop header/navigation with Hamburger Menu (☰) containing all navigation and user actions */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Emergency Quick Button */}
            <button
              onClick={() => onNavigate('report_wizard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
              aria-label="إسعاف طارئ"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>إسعاف</span>
            </button>

            {/* Mobile Hamburger Menu (☰) containing all navigation and user actions */}
            <button
              onClick={onOpenMobileDrawer}
              className="relative p-2 rounded-xl text-[#5B4D3F] bg-[#F5F2ED] hover:bg-[#E5E1D8] border border-[#E5E1D8] transition shadow-xs flex items-center justify-center min-w-[42px] min-h-[42px]"
              aria-label="فتح القائمة الرئيسية"
              title="القائمة الرئيسية"
            >
              <Menu className="w-5 h-5 text-[#5B4D3F]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
