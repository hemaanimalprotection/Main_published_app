import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AdoptionListing } from '../types';
import { dataService } from '../services/dataService';
import { 
  ShieldAlert, 
  Heart, 
  MapPin, 
  Users, 
  Stethoscope, 
  Building, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  Activity,
  HeartHandshake,
  Car,
  HeartPulse,
  Home
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  featuredAdoptions: AdoptionListing[];
  onOpenAuth: () => void;
  onOpenVolunteerRegister?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onNavigate, 
  featuredAdoptions, 
  onOpenAuth,
  onOpenVolunteerRegister 
}) => {
  const { t, isRtl } = useLanguage();
  const { isAuthenticated, isVerifiedResponder, isVolunteer } = useAuth();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const stats = dataService.getPublicStats();

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B3022] via-[#13241A] to-[#0D1812] text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#D4A373]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {/* Syrian Government Official Seal */}
          <div className="flex items-center justify-center mx-auto">
            <img 
              src="/syria-emblem.svg" 
              alt="شعار الجمهورية العربية السورية" 
              className="w-16 h-14 sm:w-20 sm:h-18 object-contain filter drop-shadow-md" 
            />
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
            <span className="block text-[#D4A373] text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              {isRtl ? 'الجمهورية العربية السورية' : 'République Arabe Syrienne'}
            </span>
            <span>
              {t.heroTitle}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#E5E1D8] max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('report_wizard')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>{t.btnReportEmergency}</span>
            </button>

            <button
              onClick={() => onNavigate('adoptions')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-sm shadow-lg shadow-[#D4A373]/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5 text-white" />
              <span>{t.btnBrowseAdoption}</span>
            </button>

            <button
              onClick={onOpenVolunteerRegister || onOpenAuth}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-5 h-5 text-emerald-200" />
              <span>انضم كمتطوع ميداني</span>
            </button>
          </div>

          {/* Quick Syrian Governorates Coverage Badge */}
          <div className="pt-8 flex items-center justify-center gap-2 text-xs text-[#E5E1D8]/80">
            <MapPin className="w-4 h-4 text-[#D4A373]" />
            <span>تغطية إسعافية وتنسيق عملياتي عبر كافة المحافظات السورية الـ ١٤</span>
          </div>
        </div>
      </section>

      {/* 2. LIVE IMPACT STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5B4D3F]">{stats.rescuesCount}</p>
              <p className="text-xs text-[#7A7167] font-medium">{t.statsRescues}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5B4D3F]">{stats.adoptionsCount}</p>
              <p className="text-xs text-[#7A7167] font-medium">{t.statsAdoptions}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5B4D3F]">{stats.volunteersCount}</p>
              <p className="text-xs text-[#7A7167] font-medium">متطوع ميداني مسجل</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5B4D3F]">14</p>
              <p className="text-xs text-[#7A7167] font-medium">{t.statsCoverage}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VOLUNTEER NETWORK HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#F9F7F2] to-white rounded-3xl border border-[#E5E1D8] p-8 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                <span>شبكة المتطوعين الميدانية في سورية</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#5B4D3F]">
                كن عوناً للأرواح الضعيفة وسجل مجالات مساعدتك
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7167] leading-relaxed">
                سواء كنت تمتلك سيارة للمساعدة في النقل والإسعاف، أو لديك خبرة في الإسعافات الأولية، أو يمكنك توفير مأوى واستضافة مؤقتة (Foster)، يمكنك التسجيل واختيار دور أو أكثر لتتلقى إشعارات فورية عند حاجة الجمعيات والأطباء لمساعدتك.
              </p>

              {/* 4 Role Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E1D8] flex items-center gap-2 text-xs font-bold text-[#5B4D3F]">
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>المساعدة بالنقل 🚗</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E1D8] flex items-center gap-2 text-xs font-bold text-[#5B4D3F]">
                  <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>إسعاف أولي 🩹</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E1D8] flex items-center gap-2 text-xs font-bold text-[#5B4D3F]">
                  <Home className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>استضافة مؤقتة 🏠</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5E1D8] flex items-center gap-2 text-xs font-bold text-[#5B4D3F]">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>مساعدات أخرى 🤝</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2.5 w-full sm:w-auto">
              <button
                onClick={onOpenVolunteerRegister || onOpenAuth}
                className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition text-center"
              >
                تسجيل متطوع جديد وتحديد الأدوار
              </button>
              {isVolunteer && (
                <button
                  onClick={() => onNavigate('volunteer_dashboard')}
                  className="px-6 py-3 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] font-bold text-xs border border-[#E5E1D8] transition text-center"
                >
                  فتح لوحة مهامي التطوعية
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#5B4D3F]">{t.howItWorksTitle}</h2>
          <p className="text-xs sm:text-sm text-[#7A7167]">
            خطوات بسيطة وفعالة لإنقاذ الأرواح الضعيفة وتوفير الرعاية الطبية الفورية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4 hover:border-[#D4A373] transition">
            <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] font-bold text-lg flex items-center justify-center">
              ١
            </div>
            <h3 className="text-base font-bold text-[#5B4D3F]">{t.step1CitizenTitle}</h3>
            <p className="text-xs text-[#7A7167] leading-relaxed">{t.step1CitizenDesc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4 hover:border-[#D4A373] transition">
            <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] text-[#D4A373] font-bold text-lg flex items-center justify-center">
              ٢
            </div>
            <h3 className="text-base font-bold text-[#5B4D3F]">{t.step2DispatchTitle}</h3>
            <p className="text-xs text-[#7A7167] leading-relaxed">{t.step2DispatchDesc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4 hover:border-[#D4A373] transition">
            <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] text-rose-700 font-bold text-lg flex items-center justify-center">
              ٣
            </div>
            <h3 className="text-base font-bold text-[#5B4D3F]">{t.step3CareTitle}</h3>
            <p className="text-xs text-[#7A7167] leading-relaxed">{t.step3CareDesc}</p>
          </div>
        </div>
      </section>

      {/* 5. FEATURED ADOPTION SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#5B4D3F]">{t.adoptionTitle}</h2>
            </div>
            <p className="text-xs text-[#7A7167] mt-1">{t.adoptionSubtitle}</p>
          </div>
          <button
            onClick={() => onNavigate('adoptions')}
            className="text-xs font-bold text-[#5B4D3F] hover:text-[#D4A373] flex items-center gap-1 bg-[#F5F2ED] border border-[#E5E1D8] px-3.5 py-2 rounded-xl transition"
          >
            <span>عرض كافة الحيوانات المتاحة</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        {featuredAdoptions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E1D8] p-10 text-center space-y-4 shadow-xs max-w-2xl mx-auto">
            <Heart className="w-12 h-12 text-[#D4A373] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#5B4D3F]">لا توجد حيوانات معروضة للتبني حالياً</h3>
              <p className="text-xs text-[#7A7167] max-w-md mx-auto leading-relaxed">
                كن أول من يساعد في إنقاذ حيوان أليف وتأمين مأوى دائم له عبر نشر إعلان تبني موثق على المنصة.
              </p>
            </div>
            <button
              onClick={() => onNavigate('publish_adoption')}
              className="px-5 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-xs transition"
            >
              نشر إعلان تبني جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAdoptions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('adoption_details', item.id)}
                className="group bg-white rounded-2xl border border-[#E5E1D8] overflow-hidden shadow-xs hover:border-[#D4A373] hover:shadow-md transition cursor-pointer flex flex-col"
              >
                {/* Photo */}
                <div className="relative aspect-4/3 overflow-hidden bg-[#F5F2ED]">
                  <img
                    src={item.photos[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#2D2D2D]/80 backdrop-blur-xs text-white text-[11px] font-bold">
                      📍 {item.city}
                    </span>
                    {item.isUrgent && (
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                        عاجل
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-[#5B4D3F]">{item.name}</h3>
                      <span className="text-xs text-[#7A7167] font-medium">{item.estimatedAge}</span>
                    </div>
                    <p className="text-xs text-[#7A7167] mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F5F2ED] flex items-center justify-between text-xs">
                    <span className="text-[#7A7167]">
                      بواسطة: <strong className="text-[#5B4D3F]">{item.publisherName}</strong>
                    </span>
                    <span className="text-[#D4A373] font-bold flex items-center gap-1">
                      طلب التبني <ArrowIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. FOR ASSOCIATIONS & VETERINARIANS CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#5B4D3F] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#6E5E4E] relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-[#F5F2ED] text-xs font-semibold">
              <Stethoscope className="w-4 h-4 text-[#D4A373]" />
              <span>للكوادر الطبية البيطرية والجمعيات الأهلية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              انضم إلى غرفة العمليات الوطنية الميدانية
            </h2>
            <p className="text-xs sm:text-sm text-[#E5E1D8] leading-relaxed">
              احصل على حق الوصول المباشر للخريطة التفاعلية لكافة البلاغات الإسعافية وشبكة المتطوعين في محافظتك، مع إمكانية التنسيق المباشر وإرسال نداءات الاستجابة الفورية.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-lg shadow-[#D4A373]/30 transition"
              >
                {t.btnJoinAsResponder}
              </button>
              {isVerifiedResponder && (
                <button
                  onClick={() => onNavigate('operational_workspace')}
                  className="px-5 py-2.5 rounded-xl bg-[#4A3D30] hover:bg-[#3D332A] text-white text-xs font-bold border border-[#6E5E4E] transition"
                >
                  فتح غرفة العمليات
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
