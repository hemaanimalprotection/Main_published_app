import React, { useState } from 'react';
import { AnimalReport } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building, 
  Stethoscope, 
  User, 
  Phone, 
  Heart, 
  Sparkles,
  Send,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface ReportDetailsPageProps {
  report: AnimalReport;
  onBack: () => void;
  onNavigateToWorkspace?: () => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({
  report,
  onBack,
  onNavigateToWorkspace
}) => {
  const { t, isRtl } = useLanguage();
  const { user, isVerifiedResponder } = useAuth();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setIsSubmitting(true);
    await dataService.addReportUpdate({
      reportId: report.id,
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role === 'responder' ? 'responder' : 'citizen',
      title: 'ملاحظة ومتابعة جديدة',
      content: commentText,
      isPublic: true,
      photos: []
    });
    setCommentText('');
    setIsSubmitting(false);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'waiting_responder':
        return { text: t.st_waiting_responder, color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'responsibility_accepted':
        return { text: t.st_responsibility_accepted, color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'responder_on_way':
        return { text: t.st_responder_on_way, color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'receiving_veterinary_care':
        return { text: t.st_receiving_veterinary_care, color: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'sheltered_or_fostered':
        return { text: t.st_sheltered_or_fostered, color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'resolved':
        return { text: t.st_resolved, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { text: status, color: 'bg-stone-100 text-stone-900 border-stone-300' };
    }
  };

  const statusInfo = getStatusDisplay(report.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4D3F] hover:text-[#2D2D2D] bg-[#F5F2ED] hover:bg-[#E5E1D8] px-3.5 py-2 rounded-xl transition border border-[#E5E1D8]"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>العودة</span>
        </button>

        {isVerifiedResponder && (
          <button
            onClick={onNavigateToWorkspace}
            className="text-xs font-bold text-[#5B4D3F] bg-[#F5F2ED] border border-[#E5E1D8] px-3.5 py-2 rounded-xl hover:bg-[#E5E1D8] transition"
          >
            فتح في غرفة العمليات الميدانية 📍
          </button>
        )}
      </div>

      {/* Main Report Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F2ED]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-[#5B4D3F] bg-[#F5F2ED] border border-[#E5E1D8] px-3 py-1 rounded-xl" dir="ltr">
                {report.referenceNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
              <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                درجة الخطورة: {report.severity === 'urgent' ? 'عاجل / تدخل سريع' : report.severity === 'moderate' ? 'متوسط' : (t as any)[`sev_${report.severity}`] || report.severity}
              </span>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                {report.problemCategory === 'abuse_violence' || report.problemCategory === 'violence' ? '⚠️ عنف أو تعذيب' :
                 report.problemCategory === 'injured' || report.problemCategory === 'injury' ? '🩹 إصابة أو نزيف' :
                 report.problemCategory === 'sick' || report.problemCategory === 'sickness' ? '🩺 مرض شديد' :
                 report.problemCategory === 'road_accident' ? '🚗 حادث سير' :
                 (t as any)[`cat_${report.problemCategory}`] || report.problemCategory}
              </span>
            </div>
            <p className="text-xs text-[#A0988E] mt-1.5">
              تاريخ وتوقيت البلاغ: {new Date(report.createdAt).toLocaleString('ar-SY')}
            </p>
          </div>
        </div>

        {/* Media & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            {report.media && report.media.length > 0 ? (
              <div className="space-y-2">
                <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#F5F2ED] border border-[#E5E1D8]">
                  <img
                    src={report.media[0]?.url}
                    alt="صورة الحالة"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {report.media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {report.media.map((m, idx) => (
                      <div key={m.id || idx} className="w-16 h-16 rounded-xl overflow-hidden border border-[#E5E1D8] shrink-0 bg-[#F5F2ED]">
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-4/3 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] flex flex-col items-center justify-center p-6 text-center text-[#7A7167]">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F2ED] text-[#A0988E] flex items-center justify-center text-xl mb-2">
                  🐾
                </div>
                <p className="text-xs font-bold text-[#5B4D3F]">لم يتم إرفاق صور بالبلاغ</p>
                <p className="text-[11px] text-[#A0988E] mt-1">
                  تم توثيق الحالة عبر الوصف النصي والإحداثيات الجغرافية
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-7 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B4D3F] mb-1">وصف الحالة:</h3>
              <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E1D8]">
                {report.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8]">
                <span className="text-[#A0988E] block text-[10px]">نوع وعدد الحيوانات</span>
                <strong className="text-[#5B4D3F]">{report.animalType} (عدد {report.animalCount})</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8]">
                <span className="text-[#A0988E] block text-[10px]">الموقع التقريبي</span>
                <strong className="text-[#5B4D3F]">{report.neighborhood}، {report.city}</strong>
              </div>
            </div>

            {/* RESCUE COORDINATION & REPORTER DETAILS */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-950">بيانات المبلّغ والتنسيق الميداني</h4>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                  {report.stayWithAnimal || report.canReporterStayNearby ? '✓ المبلّغ متواجد بالموقع' : 'مغادر للموقع'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Reporter Info */}
                <div className="space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px]">اسم المبلّغ:</span>
                    <strong className="text-stone-900 font-bold">{report.reporterContactName || report.reporterName || 'أحمد الخطيب'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-100">
                    <span className="text-stone-500 text-[11px]">الهاتف:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-stone-900 text-xs font-bold" dir="ltr">
                        {report.reporterContactPhone || '+963955654321'}
                      </span>
                      <a
                        href={`tel:${report.reporterContactPhone || '+963955654321'}`}
                        className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <a
                        href={`https://wa.me/${(report.reporterContactPhone || '+963955654321').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-1.5 py-0.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] transition"
                        title="واتساب"
                      >
                        واتساب
                      </a>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-stone-100">
                    <span className="text-stone-500 text-[10px] block">عنوان سكن المبلّغ:</span>
                    <span className="text-stone-800 text-[11px] font-medium block">
                      {report.reporterAddress || `${report.neighborhood}، ${report.city}`}
                    </span>
                  </div>
                </div>

                {/* Animal Address */}
                <div className="space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-stone-500 text-[10px] block">موقع تواجد الحيوان:</span>
                    <strong className="text-emerald-950 text-[11px] block">
                      {report.exactAddress || `${report.neighborhood}، ${report.city}`}
                    </strong>
                  </div>
                  {report.landmark && (
                    <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-stone-500 text-[10px]">أقرب معلم:</span>
                      <span className="text-stone-800 text-[11px]">{report.landmark}</span>
                    </div>
                  )}
                  {report.accessNotes && (
                    <div className="pt-1 border-t border-stone-100">
                      <span className="text-stone-500 text-[10px] block">ملاحظات الاقتراب:</span>
                      <span className="text-stone-700 text-[10px] block">{report.accessNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Responder Info */}
            <div className="p-4 rounded-xl border border-[#E5E1D8] bg-[#F9F7F2] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7A7167]">المستجيب المسؤول عن الحالة:</span>
                {report.isAssigned ? (
                  <span className="text-xs font-bold text-[#5B4D3F] bg-[#F5F2ED] px-2.5 py-0.5 rounded-md border border-[#E5E1D8]">
                    ✓ مسؤولية معتمدة
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    ⏳ بانتظار استجابة
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[#5B4D3F]">
                {report.leadResponderName || 'لم يتم استلام الحالة من قبل جمعية أو بيطري بعد'}
              </div>
            </div>
          </div>
        </div>

        {/* STATUS TIMELINE */}
        <div className="pt-6 border-t border-[#F5F2ED] space-y-4">
          <h3 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4A373]" />
            <span>سجل التطورات والتدخلات الطبية الميدانية</span>
          </h3>

          <div className="space-y-3">
            {report.statusHistory && report.statusHistory.length > 0 ? (
              report.statusHistory.map((item, idx) => (
                <div key={item.id || idx} className="p-4 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#5B4D3F]">{item.changedByName} ({getStatusDisplay(item.status).text})</h4>
                      <span className="text-[10px] text-[#A0988E] font-mono">
                        {new Date(item.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.notes && <p className="text-xs text-[#7A7167] mt-1 leading-relaxed">{item.notes}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#A0988E]">لا توجد تحديثات إضافية بعد.</p>
            )}
          </div>
        </div>

        {/* PUBLIC UPDATES FEED & POST FORM */}
        <div className="pt-6 border-t border-[#F5F2ED] space-y-4">
          <h3 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#D4A373]" />
            <span>نشرة المتابعة والتنسيق المباشر</span>
          </h3>

          {report.updates && report.updates.map(up => (
            <div key={up.id} className="p-4 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-[#5B4D3F] font-bold">{up.authorName} ({up.authorRole === 'responder' ? 'طبيب/جمعية' : 'المبلّغ'})</strong>
                <span className="text-[#A0988E] text-[10px]">{new Date(up.createdAt).toLocaleDateString('ar-SY')}</span>
              </div>
              <p className="text-xs text-[#7A7167] leading-relaxed">{up.content}</p>
            </div>
          ))}

          {/* Add update comment box */}
          {user && (
            <form onSubmit={handlePostUpdate} className="space-y-2 pt-2">
              <textarea
                required
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="أضف ملاحظة أو استفساراً جديداً حول تطور الحالة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t.saving : 'إرسال التحديث'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
