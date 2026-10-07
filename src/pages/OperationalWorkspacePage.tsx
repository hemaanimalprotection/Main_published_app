import React, { useState, useMemo } from 'react';
import { 
  AnimalReport, 
  ReportStatus, 
  SeverityLevel, 
  ResponderProfile, 
  SYRIAN_GOVERNORATES,
  VolunteerProfile 
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { SyriaLeafletMap } from '../components/map/SyriaLeafletMap';
import { VolunteersManagementSection } from '../components/volunteers/VolunteersManagementSection';
import { VolunteerDispatchModal } from '../components/volunteers/VolunteerDispatchModal';
import { VolunteerRadiusDispatchModal } from '../components/volunteers/VolunteerRadiusDispatchModal';
import { 
  MapPin, 
  ShieldAlert, 
  Building, 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  User, 
  Phone, 
  Lock, 
  Unlock, 
  AlertTriangle,
  ArrowRight,
  Share2,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  X,
  HeartHandshake,
  Heart,
  Send,
  Radio,
  FileText
} from 'lucide-react';

interface OperationalWorkspacePageProps {
  reports: AnimalReport[];
  onSelectReportId?: (id: string) => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const OperationalWorkspacePage: React.FC<OperationalWorkspacePageProps> = ({
  reports,
  onSelectReportId,
  onNavigate
}) => {
  const { t, isRtl, language } = useLanguage();
  const { user, responderProfile, isVerifiedResponder, loginAsResponder } = useAuth();
  const ArrowNext = isRtl ? ChevronLeft : ChevronRight;

  // Workspace primary view mode
  const [workspaceMode, setWorkspaceMode] = useState<'cases_map' | 'volunteers_network'>('cases_map');
  const [mobileSubView, setMobileSubView] = useState<'list' | 'details'>('list');

  // Selected Report State
  const [selectedReport, setSelectedReport] = useState<AnimalReport | null>(() => reports[0] || null);

  // Tab & Filters for cases
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'my_cases' | 'collaborations' | 'medical_trauma'>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>('responsibility_accepted');
  const [statusNotes, setStatusNotes] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteResponderId, setInviteResponderId] = useState('resp_vet_01');
  const [inviteRole, setInviteRole] = useState<'medical_care' | 'temporary_shelter' | 'transport_rescue' | 'surgical_intervention'>('medical_care');
  const [isProcessing, setIsProcessing] = useState(false);

  // Specialized Veterinarian Medical Assessment Modal State
  const [vetMedicalModalOpen, setVetMedicalModalOpen] = useState(false);
  const [vetDiagnosis, setVetDiagnosis] = useState('');
  const [vetProcedure, setVetProcedure] = useState('');
  const [vetMedications, setVetMedications] = useState('');
  const [vetNextFollowUp, setVetNextFollowUp] = useState('');
  const [vetRecommendation, setVetRecommendation] = useState<'continue_clinic' | 'ready_foster' | 'ready_adoption' | 'cured'>('continue_clinic');

  // Case-linked volunteer dispatch modal
  const [caseDispatchModalOpen, setCaseDispatchModalOpen] = useState(false);
  const [selectedVolunteerForCase, setSelectedVolunteerForCase] = useState<VolunteerProfile | null>(null);

  const isVeterinarian = responderProfile?.responderType === 'veterinarian';
  const isAssociation = responderProfile?.responderType === 'association';

  // Determine Association's registered governorate for initial map focus (without filtering reports)
  const associationGovId = responderProfile?.governoratesServed?.[0] || user?.governorate || 'damascus';
  const associationGovConfig = useMemo(() => {
    return SYRIAN_GOVERNORATES.find(g => g.id === associationGovId) || SYRIAN_GOVERNORATES[0];
  }, [associationGovId]);

  const initialMapCenter = useMemo<[number, number]>(() => {
    return [associationGovConfig.lat, associationGovConfig.lng];
  }, [associationGovConfig]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (activeTab === 'unassigned' && r.isAssigned) return false;
      if (activeTab === 'my_cases' && (!r.isAssigned || r.leadResponderId !== responderProfile?.id)) return false;
      if (activeTab === 'collaborations') {
        const isCollab = r.collaborators?.some(c => c.responderId === responderProfile?.id);
        if (!isCollab) return false;
      }
      if (activeTab === 'medical_trauma') {
        const isMedical = ['injured', 'injury', 'sick', 'sickness', 'poisoning', 'road_accident'].includes(r.problemCategory) || r.status === 'receiving_veterinary_care';
        if (!isMedical) return false;
      }

      if (governorateFilter !== 'all' && r.governorate !== governorateFilter) return false;
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = r.referenceNumber.toLowerCase().includes(q);
        const matchCity = r.city.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        if (!matchRef && !matchCity && !matchDesc) return false;
      }

      return true;
    });
  }, [reports, activeTab, governorateFilter, severityFilter, searchQuery, responderProfile]);

  // Lead responder check
  const isLeadOnSelected = selectedReport && responderProfile && selectedReport.leadResponderId === responderProfile.id;

  // Handle Accept Responsibility
  const handleAcceptResponsibility = async () => {
    if (!selectedReport || !responderProfile) return;
    setIsProcessing(true);
    const updated = await dataService.acceptResponsibility(selectedReport.id, responderProfile.id, 'تم قبول المسؤولية وتجهيز فريق الإنقاذ');
    setIsProcessing(false);
    if (updated) {
      setSelectedReport(updated);
    }
  };

  // Handle Status Change
  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !responderProfile) return;

    setIsProcessing(true);
    const updated = await dataService.updateReportStatus(
      selectedReport.id,
      newStatus,
      responderProfile.id,
      statusNotes || `تم تحديث الحالة إلى ${newStatus}`
    );
    setIsProcessing(false);
    if (updated) {
      setSelectedReport(updated);
    }
    setStatusUpdateModalOpen(false);
    setStatusNotes('');
  };

  // Veterinarian: One-click start receiving veterinary care
  const handleStartVeterinaryCare = async () => {
    if (!selectedReport || !responderProfile) return;
    setIsProcessing(true);
    // If not assigned yet, accept first
    if (!selectedReport.isAssigned) {
      await dataService.acceptResponsibility(
        selectedReport.id, 
        responderProfile.id, 
        `تم قبول الحالة الطبية بواسطة العيادة البيطرية: ${responderProfile.name}`
      );
    }
    const updated = await dataService.updateReportStatus(
      selectedReport.id,
      'receiving_veterinary_care',
      responderProfile.id,
      `🩺 بدأت الحالة بتلقي الرعاية والعلاج البيطري في عيادة ${responderProfile.clinicName || responderProfile.name}`
    );
    setIsProcessing(false);
    if (updated) {
      setSelectedReport(updated);
    }
  };

  // Veterinarian: Submit detailed medical assessment & clinical record
  const handleVetMedicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !responderProfile) return;
    if (!vetDiagnosis.trim()) return;

    setIsProcessing(true);
    const clinicalNote = `🩺 [تقرير طبي - د. ${responderProfile.name}]
التشخيص: ${vetDiagnosis.trim()}
الإجراء الطبي: ${vetProcedure.trim() || 'فحص سريري وإسعاف أولي'}
العلاج والأدوية: ${vetMedications.trim() || 'حسب الوصفة السريرية'}
المتابعة: ${vetNextFollowUp.trim() || 'مراقبة سريرية مستمرة'}
التوصية: ${
      vetRecommendation === 'ready_adoption' 
        ? 'الحالة تعافت تماماً وجاهزة للتبني وعائلة جديدة' 
        : vetRecommendation === 'ready_foster' 
          ? 'تجاوز مرحلة الخطر وبحاجة استضافة منزلية دافئة ونقاهة' 
          : vetRecommendation === 'cured'
            ? 'تم الشفاء الكامل والتعافي بنجاح'
            : 'استمرار الإقامة والرعاية في العيادة البيطرية'
    }`;

    const targetStatus: ReportStatus = 
      vetRecommendation === 'ready_adoption' 
        ? 'adoption_process' 
        : vetRecommendation === 'ready_foster' 
          ? 'sheltered_or_fostered' 
          : vetRecommendation === 'cured'
            ? 'resolved'
            : 'receiving_veterinary_care';

    const updated = await dataService.updateReportStatus(
      selectedReport.id,
      targetStatus,
      responderProfile.id,
      clinicalNote
    );
    setIsProcessing(false);
    if (updated) {
      setSelectedReport(updated);
    }
    setVetMedicalModalOpen(false);
    setVetDiagnosis('');
    setVetProcedure('');
    setVetMedications('');
    setVetNextFollowUp('');
  };

  // Handle Invite Collaborator
  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !responderProfile) return;

    setIsProcessing(true);
    const updated = await dataService.inviteCollaborator(
      selectedReport.id,
      inviteResponderId,
      inviteRole,
      responderProfile.id
    );
    setIsProcessing(false);
    if (updated) {
      setSelectedReport(updated);
    }
    setInviteModalOpen(false);
  };

  // Open dispatch for selected emergency case
  const handleOpenCaseDispatch = () => {
    const allVols = dataService.getAllVolunteers();
    // Pick nearest or first available volunteer in this governorate
    const matched = allVols.find(v => v.governorate === selectedReport?.governorate) || allVols[0];
    setSelectedVolunteerForCase(matched || null);
    setCaseDispatchModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Operations Header */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
            {responderProfile?.responderType === 'association' ? (
              <Building className="w-8 h-8 text-[#D4A373]" />
            ) : (
              <Stethoscope className="w-8 h-8 text-emerald-700" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#5B4D3F]">
                {responderProfile?.responderType === 'veterinarian'
                  ? `${responderProfile.name} • لوحة الطوارئ والرعاية البيطرية`
                  : (responderProfile?.name || 'غرفة عمليات جمعية الرفق بالحيوان')}
              </h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                responderProfile?.responderType === 'veterinarian'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>
                  {responderProfile?.responderType === 'veterinarian'
                    ? 'طبيب بيطري معتمد • نقابة الأطباء البيطريين'
                    : 'جمعية حماية وإنقاذ مرخصة'}
                </span>
              </span>
            </div>
            <p className="text-xs text-[#7A7167]">
              {responderProfile?.responderType === 'veterinarian' ? (
                <>
                  {responderProfile.clinicName ? `${responderProfile.clinicName} • ` : ''}
                  {responderProfile.registrationNumber ? `رقم القيد النقابي: ${responderProfile.registrationNumber} • ` : ''}
                  نطاق الخدمة: {responderProfile?.governoratesServed.join('، ') || 'دمشق وريفها'}
                </>
              ) : (
                <>
                  جمعية رعاية وإنقاذ حيوانات معتمدة • نطاق التغطية: {responderProfile?.governoratesServed.join('، ') || 'دمشق وريفها'}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Association / Vet Quick Action + Primary Mode Switchers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {responderProfile?.responderType === 'association' && onNavigate && (
            <button
              onClick={() => onNavigate('adoptions')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              title="إدارة الحيوانات المعروضة للتبني من قبل الجمعية"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>حيوانات المأوى والتبني</span>
            </button>
          )}

          {responderProfile?.responderType === 'veterinarian' && onNavigate && (
            <button
              onClick={() => onNavigate('adoptions')}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              title="تصفح حيوانات جاهزة للتبني بعد التعافي الطبي"
            >
              <Heart className="w-3.5 h-3.5 text-purple-600" />
              <span>حيوانات جاهزة للتبني</span>
            </button>
          )}

          {/* 2 Primary Mode Switchers: Emergency Cases vs Volunteer Network */}
          <div className="flex bg-[#F5F2ED] p-1 rounded-xl border border-[#E5E1D8]">
            <button
              onClick={() => setWorkspaceMode('cases_map')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                workspaceMode === 'cases_map'
                  ? 'bg-white text-[#5B4D3F] shadow-xs'
                  : 'text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>خريطة البلاغات والحالات</span>
            </button>

            <button
              onClick={() => setWorkspaceMode('volunteers_network')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                workspaceMode === 'volunteers_network'
                  ? 'bg-white text-[#5B4D3F] shadow-xs'
                  : 'text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>شبكة المتطوعين والإرسال</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: EMERGENCY CASES & MAP */}
      {workspaceMode === 'cases_map' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: List & Filters (4 cols on desktop; on mobile shown only in list view) */}
            <div className={`lg:col-span-4 space-y-4 ${mobileSubView !== 'list' ? 'hidden lg:block' : 'block'}`}>
            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-3 shadow-xs space-y-3">
              <div className={`grid ${responderProfile?.responderType === 'veterinarian' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-1.5 p-1 bg-[#F5F2ED] rounded-xl text-xs font-bold text-[#7A7167]`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-between gap-1 ${
                    activeTab === 'all' ? 'bg-white text-[#5B4D3F] shadow-xs ring-1 ring-[#D4A373]/30' : 'hover:text-[#5B4D3F]'
                  }`}
                >
                  <span className="truncate">{t.tabAllCases || 'جميع البلاغات'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === 'all' ? 'bg-[#5B4D3F] text-white' : 'bg-[#E5E1D8] text-[#5B4D3F]'
                  }`}>
                    {reports.length}
                  </span>
                </button>

                {responderProfile?.responderType === 'veterinarian' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('medical_trauma')}
                    className={`py-2 px-2 rounded-lg transition flex items-center justify-between gap-1 col-span-2 sm:col-span-1 ${
                      activeTab === 'medical_trauma' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <span className="truncate">حالات طبية وجراحية</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      activeTab === 'medical_trauma' ? 'bg-white text-red-700' : 'bg-red-200 text-red-900'
                    }`}>
                      {reports.filter(r => ['injured', 'injury', 'sick', 'sickness', 'poisoning', 'road_accident'].includes(r.problemCategory) || r.status === 'receiving_veterinary_care').length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('unassigned')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-between gap-1 ${
                    activeTab === 'unassigned' ? 'bg-white text-[#5B4D3F] shadow-xs ring-1 ring-[#D4A373]/30' : 'hover:text-[#5B4D3F]'
                  }`}
                >
                  <span className="truncate">{t.tabUnassigned || 'حالات شاغرة'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === 'unassigned' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {reports.filter(r => !r.isAssigned).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('my_cases')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-between gap-1 ${
                    activeTab === 'my_cases' ? 'bg-white text-[#5B4D3F] shadow-xs ring-1 ring-[#D4A373]/30' : 'hover:text-[#5B4D3F]'
                  }`}
                >
                  <span className="truncate">{t.tabMyCases || 'حالاتي المستلمة'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === 'my_cases' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {reports.filter(r => r.leadResponderId === responderProfile?.id).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('collaborations')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-between gap-1 ${
                    activeTab === 'collaborations' ? 'bg-white text-[#5B4D3F] shadow-xs ring-1 ring-[#D4A373]/30' : 'hover:text-[#5B4D3F]'
                  }`}
                >
                  <span className="truncate">{t.tabCollaborations || 'مشارك بها'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === 'collaborations' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {reports.filter(r => r.collaborators?.some(c => c.responderId === responderProfile?.id)).length}
                  </span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم البلاغ، المدينة، الوصف..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                />
                <Search className="w-3.5 h-3.5 text-[#A0988E] absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Governorate Filter */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={governorateFilter}
                  onChange={(e) => setGovernorateFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E1D8] bg-[#FDFCF9] text-[11px] text-[#2D2D2D] focus:outline-none"
                >
                  <option value="all">{t.filterGovAll}</option>
                  {SYRIAN_GOVERNORATES.map(gov => (
                    <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                  ))}
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E1D8] bg-[#FDFCF9] text-[11px] text-[#2D2D2D] focus:outline-none"
                >
                  <option value="all">جميع درجات الخطورة</option>
                  <option value="critical">🔴 حرجة وفورية</option>
                  <option value="moderate">🟠 متوسطة</option>
                  <option value="low">🟢 مستقرة</option>
                </select>
              </div>
            </div>

            {/* List of Reports as Clean Responsive Cards */}
            <div className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E1D8] text-xs text-[#7A7167]">
                  لا توجد بلاغات مطابقة للتصفية الحالية.
                </div>
              ) : (
                filteredReports.map(rep => {
                  const isSelected = selectedReport?.id === rep.id;
                  const isCritical = rep.severity === 'critical';
                  const isHighOrUrgent = rep.severity === 'high' || rep.severity === 'urgent';
                  const isModerateOrMedium = rep.severity === 'moderate' || rep.severity === 'medium';
                  const hasPhoto = rep.media && rep.media.length > 0 && rep.media[0]?.url;

                  return (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setSelectedReport(rep);
                        setMobileSubView('details');
                        if (onSelectReportId) onSelectReportId(rep.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 shadow-2xs hover:shadow-xs active:scale-[0.99] ${
                        isSelected
                          ? 'bg-[#FDF9F3] border-[#D4A373] ring-1 ring-[#D4A373]'
                          : 'bg-white border-[#E5E1D8] hover:border-[#D4A373]/60'
                      }`}
                    >
                      {/* Top Badges Bar */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#5B4D3F] bg-[#F5F2ED] px-2 py-0.5 rounded-md border border-[#E5E1D8]" dir="ltr">
                            {rep.referenceNumber}
                          </span>
                          {/* Urgency Badge */}
                          {isCritical ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                              🔴 حرجة وفورية
                            </span>
                          ) : isHighOrUrgent ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200">
                              🟠 عاجلة
                            </span>
                          ) : isModerateOrMedium ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              🟡 متوسطة
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              🟢 مستقرة
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8]">
                          {(t as any)[`st_${rep.status}`] || rep.status}
                        </span>
                      </div>

                      {/* Middle: Photo Thumbnail + Description */}
                      <div className="flex items-start gap-3">
                        {hasPhoto ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F5F2ED] shrink-0 border border-[#E5E1D8]">
                            <img
                              src={rep.media[0].url}
                              alt={rep.referenceNumber}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#F5F2ED] text-[#A0988E] shrink-0 border border-[#E5E1D8] flex items-center justify-center text-lg">
                            {rep.animalType === 'cat' ? '🐱' : rep.animalType === 'dog' ? '🐕' : '🐾'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2D2D2D] line-clamp-2 leading-relaxed">
                            {rep.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#7A7167] mt-1.5">
                            <MapPin className="w-3 h-3 text-[#D4A373] shrink-0" />
                            <span className="truncate">{rep.city} - {rep.governorate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer: Date & Tap Prompt */}
                      <div className="flex items-center justify-between text-[11px] text-[#A0988E] pt-2 border-t border-[#F5F2ED]">
                        <span>{new Date(rep.createdAt).toLocaleDateString('ar-SY')}</span>
                        <span className="text-xs font-bold text-[#D4A373] group-hover:text-[#5B4D3F] flex items-center gap-1">
                          <span>عرض التفاصيل والإجراءات</span>
                          <ArrowNext className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Desktop Leaflet Map & Selected Case Details */}
          <div className={`lg:col-span-8 space-y-6 ${mobileSubView === 'list' ? 'hidden lg:block' : 'block'}`}>
            {/* Interactive Syria Leaflet Map: KEPT ON DESKTOP ONLY, STRICTLY HIDDEN ON MOBILE */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-3 space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D4A373]" />
                  <span>الخريطة العملياتية المباشرة لسورية</span>
                </span>
                <span className="text-[11px] text-[#A0988E]">انقر على أي نقطة لاختيار الحالة</span>
              </div>

              <SyriaLeafletMap
                reports={filteredReports}
                selectedReportId={selectedReport?.id}
                center={initialMapCenter}
                zoom={associationGovConfig.zoom || 11}
                onSelectReport={(r) => {
                  setSelectedReport(r);
                  setMobileSubView('details');
                }}
                height="380px"
              />
            </div>

            {/* ACTIVE SELECTED CASE DETAILS DRAWER */}
            {selectedReport && (
              <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
                {/* Mobile Back to List Bar */}
                <div className="lg:hidden flex items-center justify-between pb-3.5 border-b border-[#F5F2ED]">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubView('list');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold transition shadow-xs active:scale-95 min-h-[44px]"
                  >
                    <ArrowNext className="w-4 h-4 rotate-180" />
                    <span>← العودة لقائمة البلاغات ({filteredReports.length})</span>
                  </button>
                  <span className="font-mono text-xs font-bold text-[#5B4D3F] bg-[#F5F2ED] px-2.5 py-1 rounded-lg border border-[#E5E1D8]" dir="ltr">
                    {selectedReport.referenceNumber}
                  </span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#F5F2ED]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#5B4D3F] bg-[#F5F2ED] px-3 py-1 rounded-lg border border-[#E5E1D8]" dir="ltr">
                        {selectedReport.referenceNumber}
                      </span>
                      {/* Urgency Level Badge */}
                      {selectedReport.severity === 'critical' ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200 flex items-center gap-1">
                          🔴 حالة حرجة وفورية
                        </span>
                      ) : selectedReport.severity === 'high' || selectedReport.severity === 'urgent' ? (
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-bold border border-orange-200 flex items-center gap-1">
                          🟠 عاجل / خطر مرتفع
                        </span>
                      ) : selectedReport.severity === 'moderate' || selectedReport.severity === 'medium' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 flex items-center gap-1">
                          🟡 حالة متوسطة
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                          🟢 حالة مستقرة
                        </span>
                      )}
                      {/* Problem Category Badge */}
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200">
                        {selectedReport.problemCategory === 'abuse_violence' || selectedReport.problemCategory === 'violence' ? '⚠️ عنف أو تعذيب' :
                         selectedReport.problemCategory === 'injured' || selectedReport.problemCategory === 'injury' ? '🩹 إصابة أو نزيف' :
                         selectedReport.problemCategory === 'sick' || selectedReport.problemCategory === 'sickness' ? '🩺 مرض شديد' :
                         selectedReport.problemCategory === 'road_accident' ? '🚗 حادث صدم' :
                         (t as any)[`cat_${selectedReport.problemCategory}`] || selectedReport.problemCategory}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#F5F2ED] text-[#5B4D3F] text-xs font-bold border border-[#E5E1D8]">
                        {(t as any)[`st_${selectedReport.status}`] || selectedReport.status}
                      </span>
                      <span className="text-xs text-[#7A7167] font-medium">
                        {new Date(selectedReport.createdAt).toLocaleString('ar-SY')}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[#5B4D3F] mt-2">
                      {selectedReport.description}
                    </h2>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Veterinarian Specific Quick Medical Care Action */}
                    {isVeterinarian && selectedReport.status !== 'receiving_veterinary_care' && selectedReport.status !== 'resolved' && (
                      <button
                        onClick={handleStartVeterinaryCare}
                        disabled={isProcessing}
                        className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>بدء الرعاية والعلاج البيطري</span>
                      </button>
                    )}

                    {/* Veterinarian Detailed Medical Assessment & Treatment Log */}
                    {isVeterinarian && (
                      <button
                        onClick={() => setVetMedicalModalOpen(true)}
                        className="px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>تسجيل التقرير الطبي وخطة العلاج</span>
                      </button>
                    )}

                    {!selectedReport.isAssigned ? (
                      <button
                        onClick={handleAcceptResponsibility}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isProcessing ? t.saving : isVeterinarian ? 'قبول المسؤولية الطبية' : t.btnAcceptResponsibility}</span>
                      </button>
                    ) : (
                      <>
                        {isLeadOnSelected && (
                          <button
                            onClick={() => setStatusUpdateModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white font-bold text-xs shadow-xs transition"
                          >
                            {t.btnUpdateStatus}
                          </button>
                        )}
                        <button
                          onClick={() => setInviteModalOpen(true)}
                          className="px-3 py-2.5 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] font-bold text-xs transition flex items-center gap-1 border border-[#E5E1D8]"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{t.btnInviteCollaborator}</span>
                        </button>
                        {/* VOLUNTEER DISPATCH BUTTON */}
                        <button
                          onClick={handleOpenCaseDispatch}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                        >
                          <HeartHandshake className="w-4 h-4 text-emerald-200" />
                          <span>طلب متطوع ميداني 📢</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* RESCUE COORDINATION & CONTACT DETAILS */}
                <div className="p-4 rounded-2xl border bg-emerald-50/70 border-emerald-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-emerald-950">بيانات المبلّغ والتنسيق الميداني المباشر</h3>
                        <p className="text-[11px] text-emerald-800">متاحة للجمعيات والأطباء البيطريين للتواصل الفوري وإنقاذ الحالة</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedReport.stayWithAnimal || selectedReport.canReporterStayNearby ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          المبلّغ متواجد بقرب الحيوان الآن
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-medium text-[11px] border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          المبلّغ وثّق الحالة وغادر الموقع
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Reporter Personal Details */}
                    <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500">👤 معلومات صاحب البلاغ:</span>
                        <span className="text-[10px] text-stone-400 font-medium">طريقة التواصل: {selectedReport.preferredContactMethod === 'whatsapp' ? 'واتساب' : 'اتصال هاتفي'}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-stone-500 text-[11px]">الاسم:</span>
                          <strong className="text-stone-900 font-bold">{selectedReport.reporterContactName || selectedReport.reporterName || 'أحمد الخطيب'}</strong>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                          <span className="text-stone-500 text-[11px]">رقم الهاتف:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 text-xs bg-stone-100 px-2 py-0.5 rounded-md" dir="ltr">
                              {selectedReport.reporterContactPhone || '+963955654321'}
                            </span>
                            <a
                              href={`tel:${selectedReport.reporterContactPhone || '+963955654321'}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 shadow-xs"
                              title="اتصال هاتفي مباشر"
                            >
                              <Phone className="w-3 h-3" />
                              <span>اتصال</span>
                            </a>
                            <a
                              href={`https://wa.me/${(selectedReport.reporterContactPhone || '+963955654321').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 shadow-xs"
                              title="محادثة واتساب فورية"
                            >
                              <span>واتساب</span>
                            </a>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-stone-100">
                          <span className="text-stone-500 text-[11px] block">🏠 عنوان سكن / إقامة المبلّغ:</span>
                          <p className="text-stone-800 text-[11px] font-medium mt-0.5 bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                            {selectedReport.reporterAddress || `${selectedReport.neighborhood}، ${selectedReport.city}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Animal Location & Spot Details */}
                    <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500">📍 عنوان وموقع تواجد الحيوان:</span>
                        <span className="text-[10px] text-emerald-700 font-mono font-medium">
                          {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-stone-500 text-[11px] block">العنوان الدقيق للحيوان:</span>
                          <p className="text-stone-900 text-xs font-bold mt-0.5 bg-emerald-50/80 text-emerald-950 p-1.5 rounded-lg border border-emerald-200">
                            {selectedReport.exactAddress || `${selectedReport.city} - ${selectedReport.neighborhood}`}
                          </p>
                        </div>

                        {selectedReport.landmark && (
                          <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-stone-100">
                            <span className="text-stone-500 text-[11px]">أقرب معلم دال:</span>
                            <span className="text-stone-800 font-medium text-xs">{selectedReport.landmark}</span>
                          </div>
                        )}

                        {selectedReport.accessNotes && (
                          <div className="pt-1 border-t border-stone-100">
                            <span className="text-stone-500 text-[11px] block">ملاحظات الاقتراب والدخول:</span>
                            <p className="text-stone-700 text-[11px] mt-0.5">{selectedReport.accessNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo & Collaborators Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#5B4D3F] mb-2">الصورة الإسعافية للحالة:</h4>
                    {selectedReport.media && selectedReport.media.length > 0 ? (
                      <div className="aspect-16/9 rounded-xl overflow-hidden bg-[#F5F2ED] border border-[#E5E1D8]">
                        <img
                          src={selectedReport.media[0]?.url}
                          alt="صورة الحالة"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="aspect-16/9 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] flex flex-col items-center justify-center p-4 text-center text-[#7A7167]">
                        <span className="text-2xl mb-1">🐾</span>
                        <span className="text-xs font-bold text-[#5B4D3F]">لم يتم إرفاق صور</span>
                        <span className="text-[10px] text-[#A0988E]">بلاغ موثق عبر الوصف الميداني</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#5B4D3F]">فريق الاستجابة والشركاء:</h4>
                    <div className="p-3.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#7A7167]">المستجيب الرئيسي:</span>
                        <strong className="text-[#5B4D3F]">{selectedReport.leadResponderName || 'شاغر'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#7A7167]">الشركاء المشاركون:</span>
                        <span className="text-[#2D2D2D]">{selectedReport.collaborators?.length || 0} شريك</span>
                      </div>
                    </div>

                    {selectedReport.collaborators && selectedReport.collaborators.length > 0 && (
                      <div className="space-y-1">
                        {selectedReport.collaborators.map(c => (
                          <div key={c.id} className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[11px] flex items-center justify-between">
                            <span className="text-[#2D2D2D]">{c.responderName}</span>
                            <span className="text-[#D4A373] font-bold">{c.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Bottom Back Button */}
                <div className="lg:hidden pt-4 border-t border-[#F5F2ED]">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubView('list');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] text-xs font-bold transition flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
                  >
                    <ArrowNext className="w-4 h-4 rotate-180" />
                    <span>العودة لقائمة البلاغات ({filteredReports.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* MODE 2: VOLUNTEERS DIRECTORY & DISPATCH */}
      {workspaceMode === 'volunteers_network' && (
        <VolunteersManagementSection
          reports={reports}
          onSelectReportId={onSelectReportId}
        />
      )}

      {/* MODAL 1: STATUS CHANGE */}
      {statusUpdateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2D2D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5E1D8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F2ED]">
              <h3 className="text-sm font-bold text-[#5B4D3F]">{t.btnUpdateStatus}</h3>
              <button onClick={() => setStatusUpdateModalOpen(false)} className="text-[#A0988E] hover:text-[#5B4D3F]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المرحلة الجديدة للحالة: *</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
                >
                  <option value="responsibility_accepted">{t.st_responsibility_accepted}</option>
                  <option value="responder_on_way">{t.st_responder_on_way}</option>
                  <option value="receiving_veterinary_care">{t.st_receiving_veterinary_care}</option>
                  <option value="sheltered_or_fostered">{t.st_sheltered_or_fostered}</option>
                  <option value="adoption_process">{t.st_adoption_process}</option>
                  <option value="resolved">{t.st_resolved}</option>
                  <option value="closed_duplicate">إغلاق (بلاغ مكرر أو غير دقيق)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">ملاحظات التحديث والتدخل الطبي:</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="اكتب تفاصيل العلاج أو الإجراء المتخذ لإشعار صاحب البلاغ..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#7A7167]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  حفظ وتحديث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVITE COLLABORATOR */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2D2D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5E1D8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F2ED]">
              <h3 className="text-sm font-bold text-[#5B4D3F]">{t.btnInviteCollaborator}</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-[#A0988E] hover:text-[#5B4D3F]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteCollaborator} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">اختيار الشريك من الشبكة المعتمدة: *</label>
                <select
                  value={inviteResponderId}
                  onChange={(e) => setInviteResponderId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
                >
                  <option value="resp_vet_01">د. سارة الحلبي (طبيبة بيطرية - عيادة الشفاء دمشق)</option>
                  <option value="resp_assoc_01">جمعية رفق لحماية الحيوان (دمشق وريفها)</option>
                  <option value="resp_assoc_02">فريق أمل لإنقاذ الحيوان (حمص)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">نوع المساعدة المطلوبة: *</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
                >
                  <option value="medical_care">فحص وعلاج بيطري (Medical Care)</option>
                  <option value="temporary_shelter">استضافة ومأوى مؤقت (Foster / Shelter)</option>
                  <option value="transport_rescue">نقل وإسعاف ميداني (Transport)</option>
                  <option value="surgical_intervention">تدخل جراحي عاجل (Surgery)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#7A7167]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  إرسال الدعوة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CASE-LINKED GEOGRAPHIC RADIUS VOLUNTEER DISPATCH */}
      {caseDispatchModalOpen && (
        <VolunteerRadiusDispatchModal
          isOpen={caseDispatchModalOpen}
          onClose={() => setCaseDispatchModalOpen(false)}
          report={selectedReport}
          reports={reports}
          initialRadiusKm={5}
          onSuccess={() => {
            setCaseDispatchModalOpen(false);
          }}
        />
      )}

      {/* MODAL 4: VETERINARIAN CLINICAL ASSESSMENT & TREATMENT RECORD */}
      {vetMedicalModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2D2D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E5E1D8] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#5B4D3F]">توثيق الفحص والتقرير الطبي البيطري</h3>
                  <p className="text-[11px] text-[#7A7167]">حالة البلاغ: #{selectedReport.referenceNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setVetMedicalModalOpen(false)} 
                className="p-1.5 rounded-lg text-[#A0988E] hover:text-[#5B4D3F] hover:bg-[#F5F2ED] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVetMedicalSubmit} className="space-y-3.5 text-xs">
              {/* Diagnosis */}
              <div>
                <label className="block font-bold text-[#5B4D3F] mb-1">
                  🩺 التشخيص السريري وتقييم الإصابة: *
                </label>
                <input
                  type="text"
                  required
                  value={vetDiagnosis}
                  onChange={(e) => setVetDiagnosis(e.target.value)}
                  placeholder="مثال: كسر مضاعف في القائمة الخلفية اليمنى، جفاف حاد، كدمات سطحية..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373] focus:outline-none"
                />
              </div>

              {/* Procedure / Intervention */}
              <div>
                <label className="block font-bold text-[#5B4D3F] mb-1">
                  🩹 الإجراء الطبي / الجراحي المنفذ:
                </label>
                <textarea
                  rows={2}
                  value={vetProcedure}
                  onChange={(e) => setVetProcedure(e.target.value)}
                  placeholder="مثال: تنظيف وتطهير الجروح، تجبير الطرف المصاب، خياطة جراحية، إعطاء سوائل وريدية..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373] focus:outline-none"
                />
              </div>

              {/* Medications & Prescription */}
              <div>
                <label className="block font-bold text-[#5B4D3F] mb-1">
                  💊 الأدوية والمضادات الموصوفة:
                </label>
                <input
                  type="text"
                  value={vetMedications}
                  onChange={(e) => setVetMedications(e.target.value)}
                  placeholder="مثال: مضاد حيوي واسع الطيف، مسكن ألم، فيتامينات داعمة..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373] focus:outline-none"
                />
              </div>

              {/* Follow-up schedule */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#5B4D3F] mb-1">
                    📅 موعد المراجعة القادمة:
                  </label>
                  <input
                    type="text"
                    value={vetNextFollowUp}
                    onChange={(e) => setVetNextFollowUp(e.target.value)}
                    placeholder="مثال: بعد 3 أيام لتبديل الضماد"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5B4D3F] mb-1">
                    🏥 التوصية الطبية والمسار:
                  </label>
                  <select
                    value={vetRecommendation}
                    onChange={(e: any) => setVetRecommendation(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] font-bold focus:ring-2 focus:ring-[#D4A373] focus:outline-none"
                  >
                    <option value="continue_clinic">بقاء في العيادة تحت المراقبة</option>
                    <option value="ready_foster">جاهز لاستضافة مؤقتة (Foster)</option>
                    <option value="ready_adoption">معافى تماماً وجاهز للتبني</option>
                    <option value="cured">تم إنجاز الشفاء والعلاج بنجاح</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setVetMedicalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E1D8] font-bold text-[#7A7167] hover:bg-[#F5F2ED] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>{isProcessing ? 'جاري الحفظ...' : 'اعتماد التقرير وتحديث الحالة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
