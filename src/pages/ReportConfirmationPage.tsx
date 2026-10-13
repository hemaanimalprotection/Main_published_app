import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  CheckCircle2, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Share2,
  Copy
} from 'lucide-react';

interface ReportConfirmationPageProps {
  referenceNumber: string;
  reportId: string;
  onNavigateToMyReports: () => void;
  onNavigateToReportDetails: (id: string) => void;
  onNavigateHome: () => void;
}

export const ReportConfirmationPage: React.FC<ReportConfirmationPageProps> = ({
  referenceNumber,
  reportId,
  onNavigateToMyReports,
  onNavigateToReportDetails,
  onNavigateHome
}) => {
  const { t, isRtl } = useLanguage();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-8 sm:p-10 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-9 h-9 text-[#D4A373]" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#5B4D3F]">{t.confirmationTitle}</h1>
          <p className="text-xs sm:text-sm text-[#7A7167] max-w-md mx-auto leading-relaxed">
            {t.confirmationDesc}
          </p>
        </div>

        {/* Reference Badge Card */}
        <div className="p-5 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-center space-y-1.5">
          <span className="text-xs text-[#7A7167] font-medium block">{t.referenceNumberLabel}</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-[#5B4D3F]" dir="ltr">
            {referenceNumber}
          </div>
          <p className="text-[11px] text-[#A0988E]">احفظ هذا الرقم لمتابعة مستجدات الحالة وعمليات الإنقاذ</p>
        </div>

        {/* Next Steps Guide */}
        <div className="p-5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-right space-y-2">
          <h4 className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#D4A373]" />
            <span>ماذا يحدث الآن؟</span>
          </h4>
          <ul className="text-xs text-[#7A7167] space-y-1 list-disc list-inside leading-relaxed">
            <li>تم بث البلاغ فورياً إلى غرفة العمليات المشتركة في محافظتك.</li>
            <li>عند قبول أي جمعية أو طبيب بيطري لمسؤولية البلاغ، ستصلك رسالة وإشعار فوري.</li>
            <li>إذا كنت متواجداً مع الحيوان، يرجى إبقاؤه في مكان هادئ وتجنب تقديم طعام ثقيل إذا كان مصاباً.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigateToReportDetails(reportId)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-md shadow-[#D4A373]/30 transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>متابعة تفاصيل البلاغ وتطوره</span>
          </button>

          <button
            onClick={onNavigateToMyReports}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] font-bold text-xs transition border border-[#E5E1D8]"
          >
            لوحة بلاغاتي
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-transparent hover:bg-[#F5F2ED] text-[#7A7167] text-xs font-semibold"
          >
            الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
