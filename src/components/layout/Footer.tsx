import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Heart, ShieldCheck, Database, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenSqlModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSqlModal }) => {
  const { t } = useLanguage();
  const { user, isVerifiedResponder, isAssociation } = useAuth();
  const isExpertOrResponder = isVerifiedResponder || isAssociation;

  return (
    <footer className="bg-[#5B4D3F] text-[#F5F2ED] pt-10 pb-6 border-t border-[#4A3D30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Syrian Government Official Header Strip inside Footer */}
        <div className="mb-8 p-4 rounded-2xl bg-[#4A3D30]/80 border border-[#6E5E4E] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-right">
            <div className="w-14 h-12 flex items-center justify-center p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <img 
                src="/syria-emblem.svg" 
                alt="شعار الجمهورية العربية السورية" 
                className="w-full h-full object-contain filter drop-shadow-sm" 
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#D4A373] tracking-wide">الجمهورية العربية السورية</p>
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                المنصة الوطنية للتبليغ وتوثيق الانتهاكات بحق الحيوان في سوريا
              </h3>
            </div>
          </div>

          <div className="text-center sm:text-left text-[11px] text-[#E5E1D8]/80 font-medium">
            <span>منظومة موحدة للتوثيق والاستجابة السريعة ورعاية الحيوان</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#6E5E4E]">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4A373] text-white flex items-center justify-center font-bold text-base shadow-xs">
                H
              </div>
              <div>
                <span className="font-bold text-base text-white tracking-tight">حِمى | Hema</span>
                <span className="text-[11px] text-[#D4A373] block font-medium">نظام التوثيق والإنقاذ والتبني الموحد</span>
              </div>
            </div>
            <p className="text-xs text-[#E5E1D8] leading-relaxed max-w-md">
              {t.appDescription}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E5E1D8]/80">
              <ShieldCheck className="w-4 h-4 text-[#D4A373] shrink-0" />
              <span>نظام حماية خصوصية بيانات المبلغين والمستجيبين معتمد بضوابط أمنية مشددة.</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">روابط المنصة</h4>
            <ul className="space-y-1.5 text-xs text-[#E5E1D8]">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#D4A373] transition">
                  {t.navHome}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('adoptions')} className="hover:text-[#D4A373] transition">
                  {t.navAdoptions}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('report_wizard')} className="text-red-300 hover:text-red-200 font-semibold transition">
                  {t.btnReportEmergency}
                </button>
              </li>
              {isExpertOrResponder && (
                <li>
                  <button onClick={() => onNavigate('operational_workspace')} className="hover:text-[#D4A373] text-amber-200 transition">
                    {t.navWorkspace}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Coverage in Syria */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">نطاق التغطية</h4>
            <p className="text-xs text-[#E5E1D8] leading-relaxed">
              تغطي شبكة حِمى كافة المحافظات الـ ١٤ السورية بالتعاون مع العيادات البيطرية والجمعيات الأهلية المسجلة.
            </p>
            <div className="text-xs text-[#E5E1D8]/80 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#D4A373] shrink-0" />
              <span>دمشق، حلب، حمص، اللاذقية، طرطوس، حماة، السويداء، درعا، وكافة المحافظات</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal, SQL & Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A0988E]">
          <div className="flex items-center gap-4">
            <span>المنظومة الوطنية للرعاية والإسعاف</span>
            <button 
              onClick={onOpenSqlModal} 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4A3D30] hover:bg-[#3D3227] text-[#D4A373] hover:text-white border border-[#6E5E4E] transition text-[11px] font-mono"
              title="Supabase SQL Schema"
            >
              <Database className="w-3 h-3 text-[#D4A373]" />
              <span>SQL</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('privacy')} className="hover:text-white transition">
              سياسة الخصوصية
            </button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition">
              الشروط والأحكام
            </button>
            <span>© ٢٠٢٦ حِمى - حماية الحيوان في سوريا</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

