import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Lock, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

interface PrivacyTermsPageProps {
  onBack: () => void;
}

export const PrivacyTermsPage: React.FC<PrivacyTermsPageProps> = ({ onBack }) => {
  const { t, isRtl } = useLanguage();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4D3F] hover:text-[#2D2D2D] bg-[#F5F2ED] hover:bg-[#E5E1D8] px-3.5 py-2 rounded-xl transition border border-[#E5E1D8]"
      >
        <ArrowIcon className="w-4 h-4" />
        <span>العودة</span>
      </button>

      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 sm:p-10 space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F5F2ED]">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#D4A373]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#5B4D3F]">
              سياسة الخصوصية والشروط القانونية لمنظومة "حِمى" - سورية
            </h1>
            <p className="text-xs text-[#7A7167]">حماية بيانات المواطنين، سلامة المسعفين، والرفق بالحيوان</p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4A373]" />
            <span>1. سياسة حماية بيانات المبلّغين (Reporter Privacy)</span>
          </h2>
          <p className="text-xs text-[#7A7167] leading-relaxed bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E1D8]">
            تلتزم منصة "حِمى" بمبدأ أدنى حد من الامتيازات (Principle of Least Privilege). لا يتم عرض رقم هاتف المبلّغ أو اسمه الكامل أو إحداثياته الدقيقة على الخريطة العامة. فقط الجمعية المرخصة أو الطبيب البيطري المعتمد الذي يقبل مسؤولية البلاغ رسمياً يستطيع الاطلاع على بيانات الاتصال لتنسيق الوصول.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4A373]" />
            <span>2. طبيعة التحقق عبر رسائل الهاتف (Phone OTP Disclaimer)</span>
          </h2>
          <p className="text-xs text-[#7A7167] leading-relaxed bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E1D8]">
            إن التحقق عبر رمز الهاتف السوري (OTP) هو إجراء أمني لمنع البلاغات العشوائية والمكررة وضمان جدية البلاغ، ولا يشكل إثبات هوية رسمية أو مدنية للمواطن.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4A373]" />
            <span>3. معايير التبني الأخلاقي والمسؤولية المتبادلة</span>
          </h2>
          <p className="text-xs text-[#7A7167] leading-relaxed bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E1D8]">
            يُحظر تماماً بيع أو المتاجرة بالحيوانات المنشورة على المنصة أو استغلالها في عروض قتالية أو تجارب ضارة. كافة عمليات التبني مجانية بالكامل وتهدف لتأمين مأوى دائم ورعاية صحية وغذائية كريمة.
          </p>
        </section>
      </div>
    </div>
  );
};
