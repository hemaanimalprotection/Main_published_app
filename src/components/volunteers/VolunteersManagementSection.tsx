import React, { useState, useMemo } from 'react';
import { 
  VolunteerProfile, 
  VolunteerRole, 
  AnimalReport, 
  VolunteerDispatchRequest,
  SYRIAN_GOVERNORATES, 
  VOLUNTEER_ROLE_DEFINITIONS 
} from '../../types';
import { dataService } from '../../services/dataService';
import { VolunteerDispatchModal } from './VolunteerDispatchModal';
import { VolunteerRadiusDispatchModal } from './VolunteerRadiusDispatchModal';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  Car, 
  HeartPulse, 
  Home, 
  Sparkles, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  Send, 
  Clock, 
  Check, 
  X,
  ShieldCheck,
  Building,
  UserCheck,
  Compass,
  Radio
} from 'lucide-react';

interface VolunteersManagementSectionProps {
  reports: AnimalReport[];
  onSelectReportId?: (id: string) => void;
}

export const VolunteersManagementSection: React.FC<VolunteersManagementSectionProps> = ({
  reports,
  onSelectReportId
}) => {
  // Data state
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>(() => dataService.getAllVolunteers());
  const [dispatches, setDispatches] = useState<VolunteerDispatchRequest[]>(() => dataService.getAllDispatches());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [hasVehicleOnly, setHasVehicleOnly] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'dispatches_log'>('directory');

  // Dispatch modals
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetVolunteer, setTargetVolunteer] = useState<VolunteerProfile | null>(null);
  const [radiusDispatchModalOpen, setRadiusDispatchModalOpen] = useState(false);

  // Subscribe to updates
  React.useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setVolunteers(dataService.getAllVolunteers());
      setDispatches(dataService.getAllDispatches());
    });
    return () => unsub();
  }, []);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      if (roleFilter !== 'all' && !v.roles.includes(roleFilter as VolunteerRole)) return false;
      if (governorateFilter !== 'all' && v.governorate !== governorateFilter) return false;
      if (availabilityFilter !== 'all' && v.availability !== availabilityFilter) return false;
      if (hasVehicleOnly && !v.hasVehicle) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.fullName.toLowerCase().includes(q);
        const matchCity = v.city.toLowerCase().includes(q);
        const matchNeigh = (v.neighborhood || '').toLowerCase().includes(q);
        const matchNote = (v.shelterCapacityNote || '').toLowerCase().includes(q) || (v.otherHelpDetails || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchNeigh && !matchNote) return false;
      }

      return true;
    });
  }, [volunteers, roleFilter, governorateFilter, availabilityFilter, hasVehicleOnly, searchQuery]);

  const handleOpenDispatch = (volunteer: VolunteerProfile) => {
    setTargetVolunteer(volunteer);
    setDispatchModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Tabs & Top Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'directory'
                ? 'bg-[#5B4D3F] text-white shadow-xs'
                : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-[#D4A373]" />
            <span>دليل المتطوعين الميدانيين ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dispatches_log')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'dispatches_log'
                ? 'bg-[#5B4D3F] text-white shadow-xs'
                : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
            }`}
          >
            <Send className="w-4 h-4 text-[#D4A373]" />
            <span>سجل نداءات الاستجابة المرسلة ({dispatches.length})</span>
          </button>
        </div>

        {/* Geographic Radius Request Button */}
        <button
          onClick={() => setRadiusDispatchModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
        >
          <Compass className="w-4 h-4 text-emerald-200" />
          <span>توزيع وطلب متطوعين حسب القطر الجغرافي 📡</span>
        </button>
      </div>

      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم المتطوع، الحي، المدينة..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                />
                <Search className="w-4 h-4 text-[#A0988E] absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {/* Role Filter (Multi-Option Filter) */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                >
                  <option value="all">جميع مجالات المساعدة (All Roles)</option>
                  <option value="transport">🚗 النقل والإسعاف الميداني</option>
                  <option value="first_aid">🩹 إسعاف أولي مدرب</option>
                  <option value="temporary_shelter">🏠 استضافة ومأوى مؤقت (Foster)</option>
                  <option value="other">🤝 مساعدات ميدانية أخرى</option>
                </select>
              </div>

              {/* Governorate Filter */}
              <div>
                <select
                  value={governorateFilter}
                  onChange={(e) => setGovernorateFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                >
                  <option value="all">جميع المحافظات السورية</option>
                  {SYRIAN_GOVERNORATES.map(gov => (
                    <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                >
                  <option value="all">جميع حالات الجاهزية</option>
                  <option value="available">🟢 متاح فوراً للطوارئ</option>
                  <option value="emergency_on_call">🟡 عند الاتصال والتنسيق</option>
                  <option value="weekends_only">🔵 عطلة نهاية الأسبوع</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle Checkbox */}
            <div className="flex items-center justify-between pt-1 border-t border-[#F5F2ED] text-xs text-[#7A7167]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasVehicleOnly}
                  onChange={(e) => setHasVehicleOnly(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>إظهار المتطوعين الذين يمتلكون وسيلة نقل فقط 🚗</span>
              </label>

              <span className="text-[11px] text-[#A0988E]">
                عرض {filteredVolunteers.length} من أصل {volunteers.length} متطوع
              </span>
            </div>
          </div>

          {/* Volunteers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#E5E1D8] p-6 space-y-2">
                <HeartHandshake className="w-10 h-10 text-[#A0988E] mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-[#5B4D3F]">لم يتم العثور على متطوعين مطابقين للتصفية</h4>
                <p className="text-xs text-[#7A7167]">جرب تغيير المحافظة أو توسيع مجالات المساعدة المختارة.</p>
              </div>
            ) : (
              filteredVolunteers.map(vol => {
                const isAvail = vol.availability === 'available';
                return (
                  <div
                    key={vol.id}
                    className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4 relative"
                  >
                    {/* Top Status & Name */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-[#5B4D3F]">{vol.fullName}</h3>
                            <span className="text-emerald-600">
                              <UserCheck className="w-4 h-4" />
                            </span>
                          </div>
                          <span className="text-xs text-[#7A7167] flex items-center gap-1 mt-0.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                            <span>{vol.governorate} - {vol.city}</span>
                            {vol.neighborhood && <span className="text-[#A0988E]">({vol.neighborhood})</span>}
                          </span>
                        </div>

                        {/* Availability Pill */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          vol.availability === 'available'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : vol.availability === 'emergency_on_call'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}>
                          {vol.availability === 'available' ? '🟢 متاح فوراً' : vol.availability === 'emergency_on_call' ? '🟡 عند الاتصال' : '🔵 عطلات'}
                        </span>
                      </div>

                      {/* Offered Roles Multi-Badge */}
                      <div className="space-y-1.5 pt-2 border-t border-[#F5F2ED]">
                        <span className="text-[10px] text-[#A0988E] block font-medium">مجالات المساعدة المتاحة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {vol.roles.map(r => (
                            <span
                              key={r}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FDF9F3] border border-[#D4A373]/40 text-[#5B4D3F] flex items-center gap-1"
                            >
                              {r === 'transport' && <Car className="w-3 h-3 text-blue-600" />}
                              {r === 'first_aid' && <HeartPulse className="w-3 h-3 text-emerald-600" />}
                              {r === 'temporary_shelter' && <Home className="w-3 h-3 text-amber-600" />}
                              {r === 'other' && <HeartHandshake className="w-3 h-3 text-purple-600" />}
                              <span>{VOLUNTEER_ROLE_DEFINITIONS[r]?.shortLabelAr}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Extra Capacity Details */}
                      <div className="mt-3 space-y-1 text-xs">
                        {vol.hasVehicle && (
                          <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px] flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>مركبة النقل: <strong>{vol.vehicleType || 'سيارة خاصة'}</strong></span>
                          </div>
                        )}

                        {vol.shelterCapacityNote && (
                          <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 text-[11px] flex items-start gap-1.5">
                            <Home className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">سعة الاستضافة: {vol.shelterCapacityNote}</span>
                          </div>
                        )}

                        {vol.otherHelpDetails && (
                          <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-purple-900 text-[11px] flex items-start gap-1.5">
                            <HeartHandshake className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">مساعدات أخرى: {vol.otherHelpDetails}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-[#F5F2ED] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#7A7167]">
                        <span className="font-mono text-xs font-bold text-[#5B4D3F]" dir="ltr">
                          📞 {vol.phone}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          🌟 {vol.totalAssistsCount} مساعدة منجزة
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenDispatch(vol)}
                        className="w-full py-2.5 rounded-xl bg-[#5B4D3F] hover:bg-[#473B2F] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-[#D4A373]" />
                        <span>إرسال نداء استجابة / طلب مساعدة</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Dispatches Log Tab */}
      {activeSubTab === 'dispatches_log' && (
        <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F5F2ED] bg-[#FDFCF9] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#D4A373]" />
              <span>سجل نداءات الاستجابة الميدانية والتنسيق مع المتطوعين</span>
            </h3>
            <span className="text-[11px] text-[#7A7167]">إجمالي النداءات: {dispatches.length}</span>
          </div>

          <div className="divide-y divide-[#F5F2ED]">
            {dispatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A7167]">
                لا توجد نداءات استجابة سابقة حتى الآن.
              </div>
            ) : (
              dispatches.map(disp => (
                <div key={disp.id} className="p-4 hover:bg-[#FDFCF9] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-xs text-[#5B4D3F]">{disp.volunteerName}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F2ED] text-[#5B4D3F]">
                        {VOLUNTEER_ROLE_DEFINITIONS[disp.roleNeeded]?.shortLabelAr}
                      </span>
                      <span className="text-[10px] text-[#A0988E]">
                        مرسل من: {disp.senderName}
                      </span>
                      <span className="text-[10px] text-[#A0988E]">
                        ({new Date(disp.createdAt).toLocaleString('ar-SY')})
                      </span>
                    </div>
                    <p className="text-xs text-[#2D2D2D] max-w-2xl">
                      "{disp.message}"
                    </p>
                    <span className="text-[11px] text-[#7A7167] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#D4A373]" />
                      الموقع: {disp.city} {disp.address ? `(${disp.address})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      disp.status === 'completed'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : disp.status === 'accepted'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {disp.status === 'completed' ? '✅ تم الإنجاز' : disp.status === 'accepted' ? '🤝 تم القبول' : '📨 تم الإرسال'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <VolunteerDispatchModal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          volunteer={targetVolunteer}
          reports={reports}
          onSuccess={() => {
            setDispatches(dataService.getAllDispatches());
            setVolunteers(dataService.getAllVolunteers());
          }}
        />
      )}

      {/* Radius Dispatch Modal */}
      {radiusDispatchModalOpen && (
        <VolunteerRadiusDispatchModal
          isOpen={radiusDispatchModalOpen}
          onClose={() => setRadiusDispatchModalOpen(false)}
          reports={reports}
          onSuccess={() => {
            setDispatches(dataService.getAllDispatches());
            setVolunteers(dataService.getAllVolunteers());
          }}
        />
      )}
    </div>
  );
};
