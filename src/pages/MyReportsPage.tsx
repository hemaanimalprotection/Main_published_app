import React, { useState } from 'react';
import { AnimalReport } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  AlertCircle,
  Building,
  Stethoscope,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MyReportsPageProps {
  reports: AnimalReport[];
  onSelectReport: (reportId: string) => void;
  onOpenNewReport: () => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({
  reports,
  onSelectReport,
  onOpenNewReport
}) => {
  const { t, isRtl } = useLanguage();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const ArrowNext = isRtl ? ChevronLeft : ChevronRight;

  const filtered = reports.filter(r => {
    if (filterStatus === 'active') return r.status !== 'resolved' && r.status !== 'closed_duplicate';
    if (filterStatus === 'resolved') return r.status === 'resolved' || r.status === 'closed_duplicate';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_responder':
        return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">⏳ {t.st_waiting_responder}</span>;
      case 'responsibility_accepted':
        return <span className="px-2.5 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] text-xs font-bold">✓ {t.st_responsibility_accepted}</span>;
      case 'responder_on_way':
        return <span className="px-2.5 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] text-xs font-bold">🚗 {t.st_responder_on_way}</span>;
      case 'receiving_veterinary_care':
        return <span className="px-2.5 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] text-xs font-bold">🩺 {t.st_receiving_veterinary_care}</span>;
      case 'sheltered_or_fostered':
        return <span className="px-2.5 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] text-xs font-bold">🏠 {t.st_sheltered_or_fostered}</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">🎉 {t.st_resolved}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4A373]" />
            <h1 className="text-2xl font-bold text-[#5B4D3F]">{t.navMyReports}</h1>
          </div>
          <p className="text-xs text-[#7A7167] mt-1">
            متابعة حالة وتطور البلاغات الإسعافية التي قمت بإرسالها في سورية
          </p>
        </div>

        <button
          onClick={onOpenNewReport}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t.btnReportEmergency}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#E5E1D8] gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            filterStatus === 'all' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          كافة البلاغات ({reports.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            filterStatus === 'active' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          الحالات النشطة والجارية
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            filterStatus === 'resolved' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          المكتملة والمنجزة
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E1D8] space-y-3">
          <FileText className="w-10 h-10 text-[#A0988E] mx-auto" />
          <h3 className="font-bold text-[#5B4D3F] text-sm">لا توجد بلاغات تطابق الفلتر</h3>
          <button
            onClick={onOpenNewReport}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
          >
            تقديم بلاغ إسعافي جديد
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs hover:border-[#D4A373] transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Media thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F5F2ED] border border-[#E5E1D8] shrink-0 flex items-center justify-center">
                  {report.media && report.media.length > 0 ? (
                    <img
                      src={report.media[0]?.url}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-[#A0988E]">
                      <span className="text-xl">🐾</span>
                      <span className="text-[9px] font-medium mt-0.5">بلا صورة</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-[#5B4D3F] bg-[#F5F2ED] border border-[#E5E1D8] px-2 py-0.5 rounded-md" dir="ltr">
                      {report.referenceNumber}
                    </span>
                    {getStatusBadge(report.status)}
                    <span className="text-[10px] font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
                      {report.problemCategory === 'abuse_violence' || report.problemCategory === 'violence' ? '⚠️ عنف أو تعذيب' :
                       report.problemCategory === 'injured' || report.problemCategory === 'injury' ? '🩹 إصابة أو نزيف' :
                       report.problemCategory === 'sick' || report.problemCategory === 'sickness' ? '🩺 مرض شديد' :
                       report.problemCategory === 'road_accident' ? '🚗 حادث سير' :
                       (t as any)[`cat_${report.problemCategory}`] || report.problemCategory}
                    </span>
                    <span className="text-[11px] text-[#A0988E]">
                      {new Date(report.createdAt).toLocaleDateString('ar-SY')}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#2D2D2D] line-clamp-1">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#7A7167] flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
                      {report.neighborhood}، {report.city}
                    </span>

                    {report.isAssigned && report.leadResponderName ? (
                      <span className="flex items-center gap-1 text-[#5B4D3F] font-bold">
                        <Building className="w-3.5 h-3.5 text-[#D4A373]" />
                        المستجيب المسؤول: {report.leadResponderName}
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold">
                        ⏳ بانتظار استجابة من الجمعيات / العيادات
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-bold text-[#D4A373] hover:underline">
                  تفاصيل الحالة
                </span>
                <ArrowNext className="w-4 h-4 text-[#A0988E]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
