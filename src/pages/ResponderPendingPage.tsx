import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, FileText, CheckCircle2, Phone, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

interface ResponderPendingPageProps {
  onBackToHome: () => void;
}

export const ResponderPendingPage: React.FC<ResponderPendingPageProps> = ({ onBackToHome }) => {
  const { t, isRtl } = useLanguage();
  const { responderProfile, user } = useAuth();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] mx-auto flex items-center justify-center">
          <Clock className="w-9 h-9 text-[#D4A373] animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            ⏳ قيد التدقيق الإداري والنقابي
          </span>
          <h1 className="text-2xl font-bold text-[#5B4D3F]">
            طلب الاعتماد المهني لـ "{responderProfile?.name || 'فريق أمل لإنقاذ الحيوان'}"
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7167] max-w-md mx-auto leading-relaxed">
            {t.pendingApprovalNotice}
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="p-5 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-right space-y-3">
          <h4 className="text-xs font-bold text-[#5B4D3F]">تفاصيل الطلب المقدم:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#7A7167]">
            <div>نوع الجهة: <strong className="text-[#5B4D3F]">{responderProfile?.responderType === 'association' ? 'جمعية أهلية' : 'طبيب بيطري'}</strong></div>
            <div>المحافظة: <strong className="text-[#5B4D3F]">{responderProfile?.governoratesServed?.join(', ') || 'دمشق'}</strong></div>
            <div>رقم الهاتف: <strong className="font-mono text-[#5B4D3F]" dir="ltr">{responderProfile?.phone || user?.phone}</strong></div>
            <div>الوثائق: <strong className="text-[#5B4D3F]">✓ تم الرفع</strong></div>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="px-6 py-2.5 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] font-bold text-xs transition border border-[#E5E1D8]"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
};
