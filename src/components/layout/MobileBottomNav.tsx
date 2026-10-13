import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Home, 
  Heart, 
  ShieldAlert, 
  FileText, 
  MapPin, 
  HeartHandshake, 
  Menu,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenMenu: () => void;
  unreadNotificationsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMenu,
  unreadNotificationsCount
}) => {
  const { user, isVerifiedResponder, isAssociation, isVolunteer } = useAuth();
  const { t } = useLanguage();

  const isExpertOrResponder = isVerifiedResponder || isAssociation;

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E1D8] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
      aria-label="شريط التنقل السفلي"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            currentView === 'home'
              ? 'text-[#5B4D3F] font-bold'
              : 'text-[#8C8276] hover:text-[#5B4D3F]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'home' ? 'bg-[#F5F2ED]' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">الرئيسية</span>
        </button>

        {/* 2. Adoptions */}
        <button
          type="button"
          onClick={() => onNavigate('adoptions')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            currentView === 'adoptions' || currentView === 'adoption_details'
              ? 'text-rose-600 font-bold'
              : 'text-[#8C8276] hover:text-[#5B4D3F]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'adoptions' ? 'bg-rose-50' : ''}`}>
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">التبني</span>
        </button>

        {/* 3. CENTER EMERGENCY CTA */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => onNavigate('report_wizard')}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 flex items-center justify-center transition-transform active:scale-95 ring-4 ring-white"
            aria-label="إسعاف طارئ فوري"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </button>
          <span className="text-[10px] font-bold text-red-600 mt-1 leading-none">إسعاف</span>
        </div>

        {/* 4. Role-Specific Action: Workspace / Volunteer / My Reports */}
        {isExpertOrResponder ? (
          <button
            type="button"
            onClick={() => onNavigate('operational_workspace')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              currentView === 'operational_workspace'
                ? 'text-[#D4A373] font-bold'
                : 'text-[#8C8276] hover:text-[#5B4D3F]'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'operational_workspace' ? 'bg-[#F9F7F2]' : ''}`}>
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">العمليات</span>
          </button>
        ) : isVolunteer ? (
          <button
            type="button"
            onClick={() => onNavigate('volunteer_dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              currentView === 'volunteer_dashboard'
                ? 'text-emerald-800 font-bold'
                : 'text-[#8C8276] hover:text-emerald-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'volunteer_dashboard' ? 'bg-emerald-50' : ''}`}>
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">مهامي</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('my_reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              currentView === 'my_reports'
                ? 'text-[#5B4D3F] font-bold'
                : 'text-[#8C8276] hover:text-[#5B4D3F]'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'my_reports' ? 'bg-[#F5F2ED]' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">بلاغاتي</span>
          </button>
        )}

        {/* 5. Menu Drawer Slide-in Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-[#8C8276] hover:text-[#5B4D3F] transition relative"
          aria-label="فتح القائمة الشاملة"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5 text-[#5B4D3F]" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">القائمة</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          )}
        </button>
      </div>
    </nav>
  );
};
