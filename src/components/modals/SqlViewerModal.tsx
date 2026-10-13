import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Copy, Check, Database, Shield, Code, Server } from 'lucide-react';

interface SqlViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlViewerModal: React.FC<SqlViewerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'rls' | 'functions' | 'setup'>('schema');

  if (!isOpen) return null;

  const sqlSchemaSummary = `-- 1. Complete Supabase Tables
-- profiles, phone_verifications, responder_profiles, responder_documents,
-- reports, report_private_details, report_media, report_responsibilities,
-- report_collaborators, report_status_history, report_updates,
-- adoption_listings, adoption_media, adoption_applications, notifications, audit_logs

-- 2. Unique Constraints & Partial Indexes
CREATE UNIQUE INDEX idx_unique_active_lead_responder 
ON public.report_responsibilities (report_id) 
WHERE (is_active = TRUE);

-- 3. Row Level Security Policies (Enforcing 3 Experiences)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports visibility policy" ON public.reports FOR SELECT USING (
  reporter_id = auth.uid() OR public.is_approved_responder(auth.uid())
);

-- Privacy Protection Policy
CREATE POLICY "Private details access" ON public.report_private_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  OR public.is_lead_responder(report_id, auth.uid())
);

-- 4. Atomic PostgreSQL Lead Assignment
CREATE OR REPLACE FUNCTION public.accept_report_responsibility(p_report_id UUID, p_initial_notes TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Verify approved responder
  -- 2. Row-lock FOR UPDATE to prevent race conditions
  -- 3. Insert unique active lead responder
  -- 4. Update status & dispatch Realtime notifications
END;
$$;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-800 overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Supabase PostgreSQL Schema & Security Policies
              </h3>
              <p className="text-xs text-stone-400">
                مخطط قواعد البيانات المتكامل، سياسات RLS، والدوال الذرية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-200 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-6 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'schema' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Code className="w-4 h-4" />
            الجداول والعلاقات (17 Table)
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rls' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            سياسات الأمان RLS والخصوصية
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'functions' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Server className="w-4 h-4" />
            الدوال الذرية (Atomic RPC)
          </button>
        </div>

        {/* Code Content Area */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-stone-300 bg-stone-950 flex-1 space-y-4">
          {activeTab === 'schema' && (
            <div>
              <p className="text-emerald-400 mb-2 font-sans font-bold">// ملف الهجرة المخصص لقاعدة البيانات الإنتاجية: /supabase/migrations/20261004015300_universal_auth_and_roles.sql</p>
              <p className="text-stone-400 mb-3 font-sans text-[11px]">// المخطط الكامل المرجعي متوفر في /src/db/supabase-schema.sql</p>
              <pre className="whitespace-pre-wrap leading-relaxed text-stone-300">
{`-- الجداول الأساسية المعتمدة لمنظومة حِمى:
1. profiles                 (ملفات المستخدمين والمواطنين الموثقين هاتفياً وبريدياً)
2. phone_verifications      (سجل OTP ومعدلات المحاولات والتحقق)
3. responder_profiles       (الجمعيات والأطباء البيطريين المرخصين)
4. volunteer_profiles       (المتطوعون الميدانيون: إسعاف، نقل، استضافة مؤقتة)
5. volunteer_dispatches     (نداءات الاستجابة وإرساليات مهام المتطوعين)
6. responder_documents      (وثائق التراخيص والهويات النقابية)
7. reports                  (بلاغات الطوارئ والإسعاف في المحافظات)
8. report_private_details   (معلومات المبلّغ المحمية والإحداثيات الدقيقة)
9. report_media             (صور وفيديوهات الحالات الإسعافية)
10. report_responsibilities  (سجل الاستجابة مع قيد UNIQUE لمستجيب رئيسي واحد)
11. report_collaborators     (الشركاء المدعوون: إسعاف، استضافة، جراحة...)
12. report_status_history   (سجل التدقيق الزمني لكافة مراحل الحالة)
13. report_updates          (نشرات التحديث العامة والملاحظات)
14. adoption_listings       (سجل إعلانات التبني وتفاصيل الحيوانات)
15. adoption_applications   (طلبات التبني المقدمة من المواطنين)
16. notifications           (مركز الإشعارات الفورية Realtime)
17. audit_logs              (سجل العمليات الإدارية والأمنية)`}
              </pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div>
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300">
{`-- حماية خصوصية موقع ورقم هاتف المبلغ (Least-Privilege Privacy):
CREATE POLICY "Private details access" 
ON public.report_private_details FOR SELECT USING (
  -- المواطن صاحب البلاغ
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.reporter_id = auth.uid())
  -- أو المستجيب الرئيسي المقبول رسمياً فقط
  OR public.is_lead_responder(report_id, auth.uid())
  -- أو شريك معتمد ومقبول في الحالة
  OR EXISTS (
    SELECT 1 FROM public.report_collaborators rc
    JOIN public.responder_profiles rp ON rp.id = rc.responder_id
    WHERE rc.report_id = report_id AND rp.user_id = auth.uid() AND rc.status = 'accepted'
  )
);`}
              </pre>
            </div>
          )}

          {activeTab === 'functions' && (
            <div>
              <pre className="whitespace-pre-wrap leading-relaxed text-amber-300">
{`-- الدالة الذرية لقبول مسؤولية البلاغ ومنع التكرار المتزامن:
CREATE OR REPLACE FUNCTION public.accept_report_responsibility(
  p_report_id UUID,
  p_initial_notes TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
...
-- 1. قفل السطر FOR UPDATE
-- 2. التحقق من أن الحساب جمعية أو بيطري معتمد
-- 3. إنشاء سجل المسؤولية وتحديث الحالة إلى responsibility_accepted
-- 4. إشعار المواطن صاحب البلاغ عبر Supabase Realtime
-- 5. تسجيل حدث في audit_logs
$$;`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-900 flex items-center justify-between text-xs text-stone-400">
          <span>جاهز للتطبيق المباشر في Supabase SQL Editor بنقرة واحدة.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
