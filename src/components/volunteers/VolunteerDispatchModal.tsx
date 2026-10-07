import React, { useState } from 'react';
import { VolunteerProfile, AnimalReport, VolunteerRole, VOLUNTEER_ROLE_DEFINITIONS } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Send, 
  Car, 
  HeartPulse, 
  Home, 
  HeartHandshake, 
  MapPin, 
  Phone, 
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface VolunteerDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: VolunteerProfile | null;
  reports: AnimalReport[];
  preSelectedReportId?: string;
  onSuccess?: () => void;
}

export const VolunteerDispatchModal: React.FC<VolunteerDispatchModalProps> = ({
  isOpen,
  onClose,
  volunteer,
  reports,
  preSelectedReportId,
  onSuccess
}) => {
  const { responderProfile, user } = useAuth();

  const [selectedReportId, setSelectedReportId] = useState<string>(preSelectedReportId || '');
  const [roleNeeded, setRoleNeeded] = useState<VolunteerRole>(() => {
    if (volunteer && volunteer.roles.length > 0) return volunteer.roles[0];
    return 'transport';
  });
  const [city, setCity] = useState(volunteer?.city || 'دمشق');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'critical'>('urgent');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !volunteer) return null;

  const senderName = responderProfile?.name || user?.fullName || 'فريق الاستجابة الميداني';
  const senderType = responderProfile?.responderType === 'association' 
    ? 'جمعية معتمدة' 
    : responderProfile?.responderType === 'veterinarian' 
      ? 'طبيب بيطري' 
      : 'جهة استجابة';

  const handleSelectReport = (repId: string) => {
    setSelectedReportId(repId);
    if (repId) {
      const rep = reports.find(r => r.id === repId);
      if (rep) {
        setCity(rep.city);
        setAddress(rep.exactAddress || rep.neighborhood || rep.city);
        setMessage(`حالة طارئة ${rep.referenceNumber}: ${rep.description.slice(0, 100)}... بحاجة لتدخل وتنسيق.`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    await dataService.sendVolunteerDispatch({
      volunteerId: volunteer.id,
      volunteerName: volunteer.fullName,
      senderId: responderProfile?.id || user?.id || 'sys_sender',
      senderName,
      senderType: responderProfile?.responderType || 'association',
      reportId: selectedReportId || undefined,
      roleNeeded,
      message: message.trim(),
      urgencyLevel,
      governorate: volunteer.governorate,
      city: city.trim() || volunteer.city,
      address: address.trim() || volunteer.neighborhood || undefined
    });

    setIsSending(false);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E1D8] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F5F2ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#5B4D3F]">
                إرسال نداء استجابة للمتطوع (Dispatch Volunteer)
              </h3>
              <p className="text-xs text-[#7A7167]">
                التنسيق المباشر مع {volunteer.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-[#5B4D3F]">
                تم إرسال نداء الاستجابة والإشعار الفوري بنجاح!
              </h4>
              <p className="text-xs text-[#7A7167]">
                تم إشعار المتطوع {volunteer.fullName} بطلب المساعدة ({VOLUNTEER_ROLE_DEFINITIONS[roleNeeded]?.shortLabelAr}).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Volunteer Capability Summary Card */}
              <div className="p-3.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#5B4D3F] block">{volunteer.fullName}</span>
                    <span className="text-[11px] text-[#7A7167] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#D4A373]" />
                      {volunteer.governorate} - {volunteer.city} {volunteer.neighborhood ? `(${volunteer.neighborhood})` : ''}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#5B4D3F] bg-white px-2 py-0.5 rounded border border-[#E5E1D8]" dir="ltr">
                    {volunteer.phone}
                  </span>
                </div>

                {/* Badges of Offered Roles */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-[#7A7167]">الأدوار المسجلة لديه:</span>
                  {volunteer.roles.map(r => (
                    <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E5E1D8] text-[#5B4D3F]">
                      {VOLUNTEER_ROLE_DEFINITIONS[r]?.shortLabelAr}
                    </span>
                  ))}
                  {volunteer.hasVehicle && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800">
                      🚗 {volunteer.vehicleType || 'مركبة خاصة'}
                    </span>
                  )}
                </div>
              </div>

              {/* Link to Case (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                  ربط الحالة الإسعافية (اختياري):
                </label>
                <select
                  value={selectedReportId}
                  onChange={(e) => handleSelectReport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                >
                  <option value="">-- نداء عام مستقل / بدون ربط بحالة محددة --</option>
                  {reports.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      [{rep.referenceNumber}] {rep.city} - {rep.description.slice(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Needed */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    الدور المطلوب من المتطوع: *
                  </label>
                  <select
                    value={roleNeeded}
                    onChange={(e: any) => setRoleNeeded(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                  >
                    <option value="transport">🚗 نقل وإسعاف ميداني</option>
                    <option value="first_aid">🩹 إسعاف أولي فوري</option>
                    <option value="temporary_shelter">🏠 استضافة ومأوى مؤقت</option>
                    <option value="other">🤝 مساعدة ودعم لوجستي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    درجة الاستعجال: *
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e: any) => setUrgencyLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                  >
                    <option value="critical">🔴 حرجة وفورية (خلال 30 دقيقة)</option>
                    <option value="urgent">🟠 عاجلة (خلال ساعتين)</option>
                    <option value="normal">🟢 عادية (تنسيق مسبق)</option>
                  </select>
                </div>
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                  نص النداء وتفاصيل المطلوب: *
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل الموقع والمهمة المطلوبة بدقة..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#7A7167]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#B88758] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'جاري الإرسال...' : 'إرسال نداء الاستجابة والإشعار'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
