import React, { useState } from 'react';
import { AdoptionListing, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Activity, 
  Sparkles, 
  X,
  AlertCircle
} from 'lucide-react';

interface AdoptionDetailsPageProps {
  listing: AdoptionListing;
  onBack: () => void;
  onOpenAuth: () => void;
}

export const AdoptionDetailsPage: React.FC<AdoptionDetailsPageProps> = ({
  listing,
  onBack,
  onOpenAuth
}) => {
  const { t, isRtl } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const [activePhoto, setActivePhoto] = useState(0);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Application form state
  const [housingType, setHousingType] = useState<'apartment' | 'house_with_garden' | 'farm' | 'other'>('apartment');
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [previousExperience, setPreviousExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    await dataService.applyForAdoption({
      listingId: listing.id,
      listingName: listing.name,
      listingPhoto: listing.photos[0] || '',
      applicantId: user.id,
      applicantName: user.fullName,
      applicantPhone: user.phone,
      applicantCity: user.city || listing.city,
      housingType,
      hasOtherPets,
      previousPetExperience: previousExperience,
      motivation
    });
    setIsSubmitting(false);
    setSubmittedSuccess(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4D3F] hover:text-[#2D2D2D] bg-[#F5F2ED] hover:bg-[#E5E1D8] px-3.5 py-2 rounded-xl transition border border-[#E5E1D8]"
      >
        <ArrowIcon className="w-4 h-4" />
        <span>العودة لسجل التبني</span>
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Gallery (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-6 bg-[#FDFCF9] border-b lg:border-b-0 lg:border-l border-[#E5E1D8] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#F5F2ED] border border-[#E5E1D8] shadow-xs">
              <img
                src={listing.photos[activePhoto] || listing.photos[0]}
                alt={listing.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Thumbnail selector */}
            {listing.photos.length > 1 && (
              <div className="flex gap-2">
                {listing.photos.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                      activePhoto === idx ? 'border-[#D4A373] shadow-xs scale-105' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Security & Privacy Guarantee */}
          <div className="p-3.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-[#5B4D3F] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D4A373]" />
              <span>ضمان التبني الأخلاقي السليم</span>
            </div>
            <p className="text-[11px] text-[#7A7167] leading-relaxed">
              تتم عملية التبني وفق شروط الرعاية المسؤولة بدون أي مقابل مالي، مع الحفاظ على سرية عنوان المعلن ومقدم الطلب.
            </p>
          </div>
        </div>

        {/* Right Column: Information & Details (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] text-xs font-bold border border-[#E5E1D8]">
                    📍 {listing.city} - {listing.governorate}
                  </span>
                  {listing.isUrgent && (
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                      🚨 حالة عاجلة
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#A0988E]">
                  نشر بتاريخ {new Date(listing.publishedAt).toLocaleDateString('ar-SY')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#5B4D3F] mt-2">{listing.name}</h1>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {listing.breed || 'سلالة محلية أليفة'} • {listing.estimatedAge} • {listing.sex === 'male' ? 'ذكر' : 'أنثى'}
              </p>
            </div>

            {/* Health & Medical Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-center">
                <span className="text-[11px] text-[#7A7167] block">التطعيم واللقاح</span>
                <span className="text-xs font-bold text-[#5B4D3F]">
                  {listing.isVaccinated ? '✅ ملقح بالكامل' : '⏳ بحاجة لقاح'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-center">
                <span className="text-[11px] text-[#7A7167] block">التعقيم / الخصي</span>
                <span className="text-xs font-bold text-[#5B4D3F]">
                  {listing.isNeutered ? '✅ معقم' : '⏳ غير معقم'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[#7A7167] block">الحجم التقريبي</span>
                <span className="text-xs font-bold text-[#5B4D3F]">
                  {listing.size === 'small' ? 'صغير' : listing.size === 'medium' ? 'متوسط' : 'كبير'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B4D3F]">{t.aboutAnimal}</h3>
              <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E1D8]">
                {listing.description}
              </p>
            </div>

            {/* Health details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B4D3F]">{t.healthAndCare}</h3>
              <p className="text-xs text-[#7A7167] leading-relaxed">
                {listing.healthCondition}
              </p>
            </div>

            {/* Compatibility */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B4D3F]">{t.compatibilityTitle}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-3 py-1 rounded-xl border font-medium ${
                  listing.goodWithChildren ? 'bg-[#F5F2ED] text-[#5B4D3F] border-[#E5E1D8]' : 'bg-[#FDFCF9] text-[#A0988E] border-[#E5E1D8]'
                }`}>
                  👶 مناسب للأطفال
                </span>
                <span className={`px-3 py-1 rounded-xl border font-medium ${
                  listing.goodWithCats ? 'bg-[#F5F2ED] text-[#5B4D3F] border-[#E5E1D8]' : 'bg-[#FDFCF9] text-[#A0988E] border-[#E5E1D8]'
                }`}>
                  🐱 متوافق مع القطط
                </span>
                <span className={`px-3 py-1 rounded-xl border font-medium ${
                  listing.goodWithDogs ? 'bg-[#F5F2ED] text-[#5B4D3F] border-[#E5E1D8]' : 'bg-[#FDFCF9] text-[#A0988E] border-[#E5E1D8]'
                }`}>
                  🐕 متوافق مع الكلاب
                </span>
              </div>
            </div>

            {/* Publisher Badge */}
            <div className="p-3.5 rounded-xl bg-[#F5F2ED] border border-[#E5E1D8] flex items-center justify-between text-xs">
              <span className="text-[#7A7167]">
                {t.publishedBy}: <strong className="text-[#5B4D3F]">{listing.publisherName}</strong>
              </span>
              <span className="text-[11px] text-[#D4A373] font-bold">
                {listing.publisherRole === 'responder' ? '⭐ جهة معتمدة' : 'مواطن موثق'}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 border-t border-[#F5F2ED]">
            {isAuthenticated ? (
              <button
                onClick={() => setApplyModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-sm shadow-md shadow-[#D4A373]/30 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>{t.btnApplyAdoption}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-full py-3.5 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول لتقديم طلب تبني</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* APPLICATION MODAL */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2D2D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E1D8] overflow-hidden relative">
            <div className="px-6 py-4 border-b border-[#F5F2ED] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] flex items-center justify-center border border-[#E5E1D8]">
                  <Heart className="w-4 h-4 text-[#D4A373]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#5B4D3F]">{t.applyFormTitle} ({listing.name})</h3>
                  <p className="text-[11px] text-[#7A7167]">إرسال استمارة رغبة التبني للمعلن</p>
                </div>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="w-8 h-8 rounded-full bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {submittedSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-[#5B4D3F] text-base">تم إرسال طلب التبني بنجاح!</h4>
                  <p className="text-xs text-[#7A7167] leading-relaxed">
                    تم إشعار المعلن ({listing.publisherName}) بطلبك وسيتواصل معك عبر التطبيق أو الهاتف لتنسيق المعاينة والتبني.
                  </p>
                  <button
                    onClick={() => { setApplyModalOpen(false); setSubmittedSuccess(false); }}
                    className="px-6 py-2 rounded-xl bg-[#D4A373] text-white font-bold text-xs shadow-xs"
                  >
                    {t.close}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">{t.housingTypeLabel} *</label>
                    <select
                      value={housingType}
                      onChange={(e: any) => setHousingType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
                    >
                      <option value="apartment">{t.housingApartment}</option>
                      <option value="house_with_garden">{t.housingHouseGarden}</option>
                      <option value="farm">{t.housingFarm}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasPets"
                      checked={hasOtherPets}
                      onChange={(e) => setHasOtherPets(e.target.checked)}
                      className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                    />
                    <label htmlFor="hasPets" className="text-xs text-[#2D2D2D] cursor-pointer">
                      {t.hasOtherPetsLabel}
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">{t.previousExperienceLabel} *</label>
                    <textarea
                      required
                      rows={2}
                      value={previousExperience}
                      onChange={(e) => setPreviousExperience(e.target.value)}
                      placeholder="هل ربيت حيوانات أليفة من قبل؟ كيف كانت تجربتك؟"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">{t.motivationLabel} *</label>
                    <textarea
                      required
                      rows={3}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="صف البيئة التي ستوفرها للحيوان ودافعك لاختياره..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-md shadow-[#D4A373]/30 transition disabled:opacity-50"
                  >
                    {isSubmitting ? t.saving : t.btnSubmitApplication}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
