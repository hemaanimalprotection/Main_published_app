import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { 
  VolunteerProfile, 
  VolunteerDispatchRequest, 
  VOLUNTEER_ROLE_DEFINITIONS,
  VolunteerRole,
  AnimalReport,
  AppNotification,
  SeverityLevel,
  AnimalType,
  ProblemCategory,
  ReportStatus,
  SYRIAN_GOVERNORATES
} from '../types';
import { SyriaLeafletMap } from '../components/map/SyriaLeafletMap';
import { 
  HeartHandshake, 
  Car, 
  HeartPulse, 
  Home, 
  Sparkles, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building,
  Check, 
  X,
  ArrowRight,
  Bell,
  BellRing,
  CheckCheck,
  ShieldAlert,
  Heart,
  Info,
  ExternalLink,
  Filter,
  Search,
  FileText,
  Activity,
  Navigation,
  CheckSquare,
  AlertCircle,
  Eye
} from 'lucide-react';

interface VolunteerDashboardPageProps {
  reports: AnimalReport[];
  onNavigate: (view: string, param?: string) => void;
}

export const VolunteerDashboardPage: React.FC<VolunteerDashboardPageProps> = ({
  reports: propReports,
  onNavigate
}) => {
  const { user, volunteerProfile } = useAuth();
  const { language } = useLanguage();
  
  const currentVolunteer = volunteerProfile || (user ? dataService.getVolunteerByUserId(user.id) : undefined);

  const [allReports, setAllReports] = useState<AnimalReport[]>(() => {
    return propReports && propReports.length > 0 ? propReports : dataService.getAllReports();
  });

  const [dispatches, setDispatches] = useState<VolunteerDispatchRequest[]>(() => {
    if (!currentVolunteer) return [];
    return dataService.getVolunteerDispatches(currentVolunteer.id);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (!currentVolunteer) return [];
    const vUserId = currentVolunteer.userId || user?.id || '';
    return vUserId ? dataService.getUserNotifications(vUserId) : [];
  });

  const [availability, setAvailability] = useState<string>(currentVolunteer?.availability || 'available');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Navigation Tabs: 'field_map' | 'assigned_tasks' | 'dispatches' | 'notifications'
  const [activeTab, setActiveTab] = useState<'field_map' | 'assigned_tasks' | 'dispatches' | 'notifications'>('field_map');

  // Field Rescue Map States
  const [selectedMapReport, setSelectedMapReport] = useState<AnimalReport | null>(null);
  const [mapScopeFilter, setMapScopeFilter] = useState<'my_governorate' | 'all' | 'waiting'>('my_governorate');
  const [fieldNoteModalOpen, setFieldNoteModalOpen] = useState(false);
  const [fieldNoteText, setFieldNoteText] = useState('');
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  
  // Filters for 'Tasks assigned to me'
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'in_progress' | 'urgent_critical' | 'completed'>('all');
  const [taskRoleFilter, setTaskRoleFilter] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // Filter for Notifications
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'urgent' | 'updates'>('all');

  // Load and subscribe to real-time changes
  useEffect(() => {
    const refreshData = () => {
      setAllReports(dataService.getAllReports());
      if (currentVolunteer) {
        const vUserId = currentVolunteer.userId || user?.id || '';
        setDispatches(dataService.getVolunteerDispatches(currentVolunteer.id));
        setNotifications(vUserId ? dataService.getUserNotifications(vUserId) : []);
      }
    };

    refreshData();
    const unsub = dataService.subscribe(refreshData);
    return () => unsub();
  }, [currentVolunteer, user]);

  const handleUpdateAvailability = async (newAvail: any) => {
    if (!currentVolunteer) return;
    setIsUpdating(true);
    setAvailability(newAvail);
    await dataService.updateVolunteerProfile(currentVolunteer.id, { availability: newAvail });
    setIsUpdating(false);
  };

  const handleRespondDispatch = async (dispatchId: string, status: 'accepted' | 'declined' | 'completed') => {
    await dataService.updateDispatchStatus(dispatchId, status);
    if (currentVolunteer) {
      setDispatches(dataService.getVolunteerDispatches(currentVolunteer.id));
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    await dataService.markNotificationRead(notifId);
    if (currentVolunteer) {
      const vUserId = currentVolunteer.userId || user?.id || 'usr_vol_01';
      setNotifications(dataService.getUserNotifications(vUserId));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      await dataService.markNotificationRead(notif.id);
    }
    if (currentVolunteer) {
      const vUserId = currentVolunteer.userId || user?.id || 'usr_vol_01';
      setNotifications(dataService.getUserNotifications(vUserId));
    }
  };

  // Volunteer: Quick field status update
  const handleVolunteerQuickStatus = async (
    reportId: string, 
    newStatus: ReportStatus, 
    actionName: string
  ) => {
    if (!currentVolunteer) return;
    setIsUpdatingField(true);
    const updaterInfo = {
      userId: currentVolunteer.userId || user?.id || 'vol_01',
      name: currentVolunteer.fullName,
      type: 'association' as const
    };
    await dataService.updateReportStatus(
      reportId,
      newStatus,
      updaterInfo,
      `🚨 تحديث ميداني من المتطوع (${currentVolunteer.fullName}): ${actionName}`
    );
    setIsUpdatingField(false);
    setAllReports(dataService.getAllReports());
    if (selectedMapReport && selectedMapReport.id === reportId) {
      setSelectedMapReport(dataService.getReportById(reportId) || null);
    }
  };

  // Volunteer: Submit on-site field note
  const handleFieldNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMapReport || !currentVolunteer || !fieldNoteText.trim()) return;
    setIsUpdatingField(true);
    await dataService.updateReportStatus(
      selectedMapReport.id,
      selectedMapReport.status,
      {
        userId: currentVolunteer.userId || user?.id || 'vol_01',
        name: currentVolunteer.fullName,
        type: 'association' as const
      },
      `📝 ملاحظة وتوثيق ميداني من المتطوع (${currentVolunteer.fullName}): ${fieldNoteText.trim()}`
    );
    setIsUpdatingField(false);
    setFieldNoteModalOpen(false);
    setFieldNoteText('');
    setAllReports(dataService.getAllReports());
    setSelectedMapReport(dataService.getReportById(selectedMapReport.id) || null);
  };

  // Helper translations and badges
  const getAnimalTypeLabel = (type: AnimalType) => {
    switch (type) {
      case 'dog': return '🐕 كلب';
      case 'cat': return '🐈 قطة';
      case 'bird': return '🕊️ طائر';
      case 'horse_donkey': return '🐴 حصان / حمار';
      case 'farm_animal': return '🐑 حيوان مزرعة';
      case 'wildlife': return '🦊 حيوان بري';
      default: return '🐾 حيوان أليف';
    }
  };

  const getProblemCategoryLabel = (problem: ProblemCategory | string) => {
    switch (problem) {
      case 'abuse_violence':
      case 'violence': return '⚠️ عنف أو تعذيب بحق حيوان';
      case 'road_accident': return '🚗 حادث صدم أو سير';
      case 'injured':
      case 'injury': return '🩹 إصابة أو نزيف';
      case 'sick':
      case 'sickness': return '🩺 مرض أو تسمم';
      case 'abandoned':
      case 'abandonment': return '🚪 مهجور وبحاجة رعاية';
      case 'homeless':
      case 'homelessness': return '🌧️ مشرد بدون مأوى';
      case 'trapped':
      case 'entrapment': return '🪤 عالق أو محتجز';
      case 'mother_babies': return '🍼 أم مع صغارها';
      case 'shelter_needed': return '🏡 بحاجة استضافة مؤقتة';
      case 'poisoning': return '🧪 حالة تسمم إسعافية';
      case 'food_water': return '💧 بحاجة ماء وغذاء عاجل';
      case 'other_emergency': return '🚨 حالة طارئة';
      default: return '🚨 حالة استغاثة عاجلة';
    }
  };

  const getSeverityBadge = (sev: SeverityLevel | string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">🔴 حرج جداً - فوري</span>;
      case 'high':
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">🟠 عالي الخطورة</span>;
      case 'medium':
      case 'moderate':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🟡 متوسط</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 مستقر</span>;
    }
  };

  const getReportStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'responsibility_accepted':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">🤝 تم قبول المسؤولية والتنسيق</span>;
      case 'responder_on_way':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">🚗 فريق الإنقاذ في الطريق</span>;
      case 'receiving_veterinary_care':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">🩺 يتلقى الرعاية الطبية</span>;
      case 'sheltered_or_fostered':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">🏡 في الاستضافة والرعاية</span>;
      case 'resolved':
      case 'closed':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">✅ تم إنجاز الحالة بالكامل</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8]">📋 جاري المتابعة الميدانية</span>;
    }
  };

  // Compile Assigned Tasks (Rescue Reports linked to current volunteer)
  const assignedTasks = useMemo(() => {
    if (!currentVolunteer) return [];

    const volId = currentVolunteer.id;
    const volUserId = currentVolunteer.userId || '';

    return allReports
      .filter(report => {
        // Direct assignment in report
        const isDirectlyAssigned = report.assignedVolunteerId === volId || report.assignedVolunteerId === volUserId;
        
        // Linked via dispatch request
        const hasMatchingDispatch = dispatches.some(
          d => (d.reportId === report.id || d.reportReference === report.referenceNumber) && d.status !== 'declined'
        );

        return isDirectlyAssigned || hasMatchingDispatch;
      })
      .map(report => {
        // Find matching dispatch if any
        const matchingDispatch = dispatches.find(
          d => d.reportId === report.id || d.reportReference === report.referenceNumber
        );

        // Determine specific volunteer role assigned
        const assignedRole: VolunteerRole = 
          matchingDispatch?.roleNeeded || 
          report.assignedVolunteerRole || 
          currentVolunteer.roles[0] || 
          'transport';

        // Determine status
        const isCompleted = matchingDispatch?.status === 'completed' || report.status === 'resolved' || report.status === 'closed';
        const isCriticalOrUrgent = report.severity === 'critical' || report.severity === 'high' || matchingDispatch?.urgencyLevel === 'critical' || matchingDispatch?.urgencyLevel === 'urgent';
        
        return {
          report,
          dispatch: matchingDispatch,
          assignedRole,
          isCompleted,
          isCriticalOrUrgent
        };
      });
  }, [allReports, dispatches, currentVolunteer]);

  // Filter Assigned Tasks
  const filteredAssignedTasks = useMemo(() => {
    return assignedTasks.filter(item => {
      const { report, dispatch, assignedRole, isCompleted, isCriticalOrUrgent } = item;

      // Status filter
      if (taskStatusFilter === 'in_progress') {
        if (isCompleted) return false;
      } else if (taskStatusFilter === 'urgent_critical') {
        if (!isCriticalOrUrgent) return false;
      } else if (taskStatusFilter === 'completed') {
        if (!isCompleted) return false;
      }

      // Role filter
      if (taskRoleFilter !== 'all' && assignedRole !== taskRoleFilter) {
        return false;
      }

      // Search Query
      if (taskSearchQuery.trim() !== '') {
        const q = taskSearchQuery.toLowerCase();
        const refMatch = report.referenceNumber.toLowerCase().includes(q);
        const descMatch = (report.description || '').toLowerCase().includes(q);
        const cityMatch = (report.city || '').toLowerCase().includes(q);
        const neighMatch = (report.neighborhood || '').toLowerCase().includes(q);
        const leadMatch = (report.leadResponderName || '').toLowerCase().includes(q);
        const animalMatch = getAnimalTypeLabel(report.animalType).toLowerCase().includes(q);

        if (!refMatch && !descMatch && !cityMatch && !neighMatch && !leadMatch && !animalMatch) {
          return false;
        }
      }

      return true;
    });
  }, [assignedTasks, taskStatusFilter, taskRoleFilter, taskSearchQuery]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      if (notificationFilter === 'unread') return !notif.isRead;
      if (notificationFilter === 'urgent') return notif.type.includes('dispatch') || notif.type.includes('urgent');
      if (notificationFilter === 'updates') return notif.type.includes('status') || notif.type.includes('resolved') || notif.type.includes('welcome');
      return true;
    });
  }, [notifications, notificationFilter]);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const pendingDispatchesCount = dispatches.filter(d => d.status === 'sent').length;
  const inProgressTasksCount = assignedTasks.filter(t => !t.isCompleted).length;
  const completedTasksCount = assignedTasks.filter(t => t.isCompleted).length;
  const criticalTasksCount = assignedTasks.filter(t => t.isCriticalOrUrgent && !t.isCompleted).length;

  if (!currentVolunteer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <HeartHandshake className="w-12 h-12 text-[#A0988E] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#5B4D3F]">لوحة المتطوع الميداني</h2>
        <p className="text-xs text-[#7A7167] mt-1">يرجى تسجيل الدخول بحساب متطوع لعرض المهام ونداءات الاستجابة والإشعارات.</p>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('dispatch') || type.includes('urgent')) {
      return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
    if (type.includes('adoption')) {
      return <Heart className="w-4 h-4 text-rose-500" />;
    }
    if (type.includes('resolved') || type.includes('accepted')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    return <Info className="w-4 h-4 text-[#D4A373]" />;
  };

  const volGovernorate = currentVolunteer?.governorate || 'damascus';
  const volGovObj = SYRIAN_GOVERNORATES.find(g => g.id === volGovernorate) || SYRIAN_GOVERNORATES[0];

  const mapReports = useMemo(() => {
    return allReports.filter(r => {
      if (mapScopeFilter === 'my_governorate') {
        return r.governorate === volGovernorate;
      }
      if (mapScopeFilter === 'waiting') {
        return !r.isAssigned || r.status === 'waiting_responder' || r.status === 'submitted';
      }
      return true;
    });
  }, [allReports, mapScopeFilter, volGovernorate]);

  const waitingReportsCount = useMemo(() => {
    return allReports.filter(r => !r.isAssigned || r.status === 'waiting_responder' || r.status === 'submitted').length;
  }, [allReports]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF9F3] border border-[#D4A373] text-[#D4A373] flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#5B4D3F]">{currentVolunteer.fullName}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✅ متطوع موثق ومعتمد
              </span>
            </div>
            <p className="text-xs text-[#7A7167] flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{currentVolunteer.governorate} - {currentVolunteer.city}</span>
              {currentVolunteer.neighborhood && <span>({currentVolunteer.neighborhood})</span>}
              <span className="mx-1">•</span>
              <span className="font-mono" dir="ltr">📞 {currentVolunteer.phone}</span>
            </p>
          </div>
        </div>

        {/* Quick Availability Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#F9F7F2] p-3 rounded-xl border border-[#E5E1D8]">
          <span className="text-xs font-bold text-[#5B4D3F]">حالة الجاهزية الحالية:</span>
          <select
            value={availability}
            onChange={(e) => handleUpdateAvailability(e.target.value)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#2D2D2D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
          >
            <option value="available">🟢 متاح فوراً للطوارئ</option>
            <option value="emergency_on_call">🟡 عند الاتصال والتنسيق</option>
            <option value="weekends_only">🔵 عطلة نهاية الأسبوع فقط</option>
            <option value="busy">⚪ مشغول حالياً</option>
          </select>
        </div>
      </div>

      {/* Volunteer Capabilities & Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles Box */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D4A373]" />
            <span>مجالات المساعدة المحددة لديك</span>
          </h3>
          <div className="space-y-2">
            {currentVolunteer.roles.map(r => (
              <div key={r} className="p-2.5 rounded-xl bg-[#FDF9F3] border border-[#D4A373]/30 flex items-center gap-2">
                {r === 'transport' && <Car className="w-4 h-4 text-blue-600" />}
                {r === 'first_aid' && <HeartPulse className="w-4 h-4 text-emerald-600" />}
                {r === 'temporary_shelter' && <Home className="w-4 h-4 text-amber-600" />}
                {r === 'other' && <HeartHandshake className="w-4 h-4 text-purple-600" />}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#5B4D3F] block">
                    {VOLUNTEER_ROLE_DEFINITIONS[r]?.shortLabelAr}
                  </span>
                  <span className="text-[10px] text-[#7A7167]">
                    {VOLUNTEER_ROLE_DEFINITIONS[r]?.descriptionAr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment & Details */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-600" />
            <span>المركبة وتجهيزات الاستضافة</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 space-y-0.5">
              <span className="font-bold block">وسيلة النقل:</span>
              <p className="text-[11px]">{currentVolunteer.hasVehicle ? currentVolunteer.vehicleType || 'مركبة خاصة' : 'لا تتوفر وسيلة نقل خاصة'}</p>
            </div>
            {currentVolunteer.shelterCapacityNote && (
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 space-y-0.5">
                <span className="font-bold block">سعة الاستضافة المؤقتة (Foster):</span>
                <p className="text-[11px]">{currentVolunteer.shelterCapacityNote}</p>
              </div>
            )}
            {currentVolunteer.otherHelpDetails && (
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-purple-900 space-y-0.5">
                <span className="font-bold block">مساعدات أخرى:</span>
                <p className="text-[11px]">{currentVolunteer.otherHelpDetails}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Assists */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" />
            <span>سجل الإنجاز والمساعدات</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E1D8]">
              <span className="text-2xl font-bold text-[#5B4D3F] block">{currentVolunteer.totalAssistsCount}</span>
              <span className="text-[10px] text-[#7A7167]">مهمة مكتملة</span>
            </div>
            <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E1D8]">
              <span className="text-2xl font-bold text-amber-600 block">{currentVolunteer.rating.toFixed(1)} ★</span>
              <span className="text-[10px] text-[#7A7167]">تقييم الجمعيات</span>
            </div>
          </div>
          <p className="text-[11px] text-[#7A7167] text-center pt-1">
            شكراً لجهودك وعطائك في حماية وإنقاذ الأرواح الضعيفة في سورية 🐾
          </p>
        </div>
      </div>

      {/* Main Operations & Notifications Hub Section */}
      <div className="space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E1D8] shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Tab 0: Field Rescue Reports Map */}
            <button
              onClick={() => setActiveTab('field_map')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'field_map'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeTab === 'field_map' ? 'text-white' : 'text-emerald-600'}`} />
              <span>خريطة البلاغات الميدانية</span>
              {waitingReportsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                  {waitingReportsCount}
                </span>
              )}
            </button>

            {/* Tab 1: Tasks assigned to me */}
            <button
              onClick={() => setActiveTab('assigned_tasks')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'assigned_tasks'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#D4A373]" />
              <span>مهام الإنقاذ المسندة إليّ</span>
              {inProgressTasksCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-700 text-white">
                  {inProgressTasksCount}
                </span>
              )}
            </button>

            {/* Tab 2: Dispatches */}
            <button
              onClick={() => setActiveTab('dispatches')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'dispatches'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#D4A373]" />
              <span>نداءات الاستجابة والطلبات</span>
              {pendingDispatchesCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                  {pendingDispatchesCount}
                </span>
              )}
            </button>

            {/* Tab 3: Notifications */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'notifications'
                  ? 'bg-[#5B4D3F] text-white shadow-xs'
                  : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
              }`}
            >
              <BellRing className="w-4 h-4 text-[#D4A373]" />
              <span>سجل الإشعارات والتنبيهات المباشرة</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-700 text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-[#7A7167] hidden md:block">
            {activeTab === 'assigned_tasks' && '🐾 بلاغات الإنقاذ والحالات الميدانية المكلف بها رسمياً'}
            {activeTab === 'dispatches' && '📋 نداءات التنسيق الموجهة لك من الجمعيات والأطباء'}
            {activeTab === 'notifications' && '🔔 جميع التنبيهات وتحديثات البلاغات الميدانية'}
          </div>
        </div>

        {/* TAB 1: FILTERED 'TASKS ASSIGNED TO ME' SECTION */}
        {activeTab === 'assigned_tasks' && (
          <div className="space-y-4">
            {/* Quick Metrics Bar for Tasks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E1D8] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-[#5B4D3F] block leading-none">{assignedTasks.length}</span>
                  <span className="text-[10px] text-[#7A7167]">إجمالي البلاغات المسندة</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E1D8] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-amber-700 block leading-none">{inProgressTasksCount}</span>
                  <span className="text-[10px] text-[#7A7167]">قيد التنفيذ والمتابعة</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E1D8] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-red-700 block leading-none">{criticalTasksCount}</span>
                  <span className="text-[10px] text-[#7A7167]">حالات حرجة وطارئة</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E1D8] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-emerald-700 block leading-none">{completedTasksCount}</span>
                  <span className="text-[10px] text-[#7A7167]">مهام منجزة ومكتملة</span>
                </div>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#A0988E] absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="البحث برقم البلاغ، نوع الحيوان، المدينة، أو اسم الجهة المشرفة..."
                    className="w-full pr-9 pl-4 py-2 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2D2D] placeholder-[#A0988E] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                  />
                  {taskSearchQuery && (
                    <button
                      onClick={() => setTaskSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A0988E] hover:text-[#5B4D3F]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B4D3F] shrink-0">نوع المهمة:</span>
                  <select
                    value={taskRoleFilter}
                    onChange={(e) => setTaskRoleFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2D2D] font-bold focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                  >
                    <option value="all">جميع مجالات المساعدة</option>
                    <option value="transport">🚗 نقل وتوصيل إسعافي</option>
                    <option value="first_aid">🩺 إسعاف أولي ميداني</option>
                    <option value="temporary_shelter">🏡 استضافة ورعاية مؤقتة</option>
                    <option value="other">🤝 مساعدات ميدانية أخرى</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#F5F2ED]">
                <span className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>تصفية الحالة:</span>
                </span>
                
                <button
                  onClick={() => setTaskStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    taskStatusFilter === 'all'
                      ? 'bg-[#5B4D3F] text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  الكل ({assignedTasks.length})
                </button>

                <button
                  onClick={() => setTaskStatusFilter('in_progress')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    taskStatusFilter === 'in_progress'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  <span>🚗 قيد التنفيذ والمتابعة</span>
                  <span className="text-[10px]">({inProgressTasksCount})</span>
                </button>

                <button
                  onClick={() => setTaskStatusFilter('urgent_critical')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    taskStatusFilter === 'urgent_critical'
                      ? 'bg-red-700 text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  <span>🚨 حالات حرجة وعاجلة</span>
                  <span className="text-[10px]">({criticalTasksCount})</span>
                </button>

                <button
                  onClick={() => setTaskStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    taskStatusFilter === 'completed'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  <span>✅ مهام مكتملة</span>
                  <span className="text-[10px]">({completedTasksCount})</span>
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredAssignedTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E1D8] p-12 text-center space-y-3 shadow-xs">
                  <CheckSquare className="w-12 h-12 text-[#A0988E] mx-auto opacity-40" />
                  <h4 className="text-sm font-bold text-[#5B4D3F]">لا توجد مهام إنقاذ مطابقة لهذا الفلتر</h4>
                  <p className="text-xs text-[#7A7167] max-w-md mx-auto">
                    {taskSearchQuery || taskStatusFilter !== 'all' || taskRoleFilter !== 'all'
                      ? 'جرب تعديل خيارات البحث أو تصفية الحالة لعرض بقية المهام المسندة إليك.'
                      : 'ستظهر هنا جميع بلاغات الإنقاذ وحالات الطوارئ التي يتم إسنادها وتكليفك بها.'}
                  </p>
                  {(taskSearchQuery || taskStatusFilter !== 'all' || taskRoleFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setTaskStatusFilter('all');
                        setTaskRoleFilter('all');
                        setTaskSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#F5F2ED] text-xs font-bold text-[#5B4D3F] hover:bg-[#E5E1D8] transition"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  )}
                </div>
              ) : (
                filteredAssignedTasks.map(({ report, dispatch, assignedRole, isCompleted }) => {
                  const roleDef = VOLUNTEER_ROLE_DEFINITIONS[assignedRole];
                  const hasPhoto = report.media && report.media.length > 0 && report.media[0].url;

                  return (
                    <div
                      key={report.id}
                      className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                        isCompleted ? 'border-[#E5E1D8] opacity-90' : 'border-[#D4A373]/50 hover:border-[#D4A373]'
                      }`}
                    >
                      {/* Top Meta Bar */}
                      <div className="p-4 sm:p-5 bg-[#FDFCF9] border-b border-[#F5F2ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#5B4D3F] text-white">
                            {report.referenceNumber}
                          </span>
                          
                          {getSeverityBadge(report.severity)}
                          
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                            roleDef?.badgeBg || 'bg-blue-50 border-blue-200'
                          } ${roleDef?.badgeText || 'text-blue-800'}`}>
                            {assignedRole === 'transport' && <Car className="w-3.5 h-3.5" />}
                            {assignedRole === 'first_aid' && <HeartPulse className="w-3.5 h-3.5" />}
                            {assignedRole === 'temporary_shelter' && <Home className="w-3.5 h-3.5" />}
                            {assignedRole === 'other' && <HeartHandshake className="w-3.5 h-3.5" />}
                            <span>مهمتك: {roleDef?.shortLabelAr || 'مساعدة ميدانية'}</span>
                          </span>

                          <span className="text-[11px] text-[#A0988E] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(report.createdAt).toLocaleString('ar-SY')}</span>
                          </span>
                        </div>

                        <div>
                          {isCompleted ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تم إنجاز المهمة بنجاح</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>مهمة نشطة - قيد التنفيذ</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Report Body */}
                      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left/Main Column: Info & Details */}
                        <div className="lg:col-span-8 space-y-4">
                          {/* Animal and Category Summary */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-bold text-[#5B4D3F] bg-[#F9F7F2] px-3 py-1.5 rounded-xl border border-[#E5E1D8]">
                              {getAnimalTypeLabel(report.animalType)} {report.animalCount > 1 ? `(${report.animalCount} حيوانات)` : ''}
                            </span>
                            <span className="text-xs font-bold text-[#7A7167] bg-[#F9F7F2] px-3 py-1.5 rounded-xl border border-[#E5E1D8]">
                              {getProblemCategoryLabel(report.problemCategory)}
                            </span>
                            {getReportStatusBadge(report.status)}
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-[#5B4D3F]">وصف البلاغ وحالة الحيوان:</span>
                            <p className="text-xs text-[#2D2D2D] leading-relaxed font-medium bg-[#FAF9F5] p-3 rounded-xl border border-[#EBE7DF]">
                              {report.description}
                            </p>
                          </div>

                          {/* Specific Dispatch Instruction Message (if from association/vet) */}
                          {dispatch?.message && (
                            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                              <span className="font-bold flex items-center gap-1.5 text-blue-900">
                                <Building className="w-3.5 h-3.5 text-blue-700" />
                                <span>توجيهات {dispatch.senderName}:</span>
                              </span>
                              <p className="text-[11px] leading-relaxed font-medium">
                                "{dispatch.message}"
                              </p>
                            </div>
                          )}

                          {/* Location & Directions Card */}
                          <div className="p-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#5B4D3F] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
                                <span>الموقع الميداني الدقيق:</span>
                              </span>
                              <span className="text-[11px] text-[#7A7167] font-semibold">{report.city} - {report.neighborhood}</span>
                            </div>

                            <p className="text-xs text-[#2D2D2D] font-medium">
                              📍 <strong>{report.exactAddress || `${report.city} - ${report.neighborhood}`}</strong>
                              {report.landmark && <span className="text-[#7A7167]"> (علامة مميزة: {report.landmark})</span>}
                            </p>

                            {report.accessNotes && (
                              <p className="text-[11px] text-[#7A7167]">
                                🚗 ملاحظات الوصول: {report.accessNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Photo, Coordinator & Action Shortcuts */}
                        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
                          {/* Photo Thumbnail */}
                          {hasPhoto && (
                            <div className="relative h-36 rounded-xl overflow-hidden border border-[#E5E1D8] shadow-xs">
                              <img
                                src={report.media[0].url}
                                alt="Animal"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                                صورة موثقة
                              </span>
                            </div>
                          )}

                          {/* Coordinator & Contact Details */}
                          <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] space-y-2 text-xs">
                            {report.leadResponderName && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-[#7A7167] block">الجهة المشرفة المنسقة:</span>
                                <span className="font-bold text-[#5B4D3F] flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5 text-[#D4A373]" />
                                  <span>{report.leadResponderName}</span>
                                </span>
                              </div>
                            )}

                            {report.reporterContactPhone && (
                              <div className="space-y-0.5 pt-1 border-t border-[#F5F2ED]">
                                <span className="text-[10px] text-[#7A7167] block">المبلّغ في الموقع:</span>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#5B4D3F]">{report.reporterContactName || 'المواطن المبلّغ'}</span>
                                  <a
                                    href={`tel:${report.reporterContactPhone}`}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                                    dir="ltr"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{report.reporterContactPhone}</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-1">
                            <button
                              onClick={() => onNavigate('report_details', report.id)}
                              className="w-full px-4 py-2 rounded-xl bg-[#D4A373] hover:bg-[#B88758] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              <span>عرض تفاصيل البلاغ والتنسيق الميداني</span>
                              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>

                            {/* Mark task completed if active */}
                            {dispatch && dispatch.status === 'accepted' && (
                              <button
                                onClick={() => handleRespondDispatch(dispatch.id, 'completed')}
                                className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تأكيد إنجاز المهمة بنجاح ✅</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INCOMING DISPATCHES & DIRECT REQUESTS */}
        {activeTab === 'dispatches' && (
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#F5F2ED] bg-[#FDFCF9] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#5B4D3F] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D4A373]" />
                  <span>نداءات الاستجابة وطلبات المساعدة المباشرة ({dispatches.length})</span>
                </h2>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  تصلك هذه النداءات مباشرة من الجمعيات والأطباء البيطريين عند حاجتهم لتدخلك.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#F5F2ED]">
              {dispatches.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <HeartHandshake className="w-10 h-10 text-[#A0988E] mx-auto opacity-40" />
                  <h4 className="text-xs font-bold text-[#5B4D3F]">لا توجد نداءات معلقة حالياً</h4>
                  <p className="text-[11px] text-[#7A7167]">سيصلك إشعار فوري عند توجيه أي نداء استجابة في منطقتك.</p>
                </div>
              ) : (
                dispatches.map(disp => (
                  <div key={disp.id} className="p-5 hover:bg-[#FDFCF9] transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#5B4D3F] text-white">
                          {VOLUNTEER_ROLE_DEFINITIONS[disp.roleNeeded]?.shortLabelAr}
                        </span>
                        <span className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-[#D4A373]" />
                          المرسل: {disp.senderName}
                        </span>
                        <span className="text-[11px] text-[#A0988E]">
                          {new Date(disp.createdAt).toLocaleString('ar-SY')}
                        </span>
                      </div>

                      <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                        disp.status === 'completed'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : disp.status === 'accepted'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {disp.status === 'completed' ? '✅ تم إنجاز المهمة' : disp.status === 'accepted' ? '🤝 قبلت المهمة - قيد التنفيذ' : '📨 نداء استجابة جديد'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-1 text-xs">
                      <p className="text-[#2D2D2D] leading-relaxed font-medium">
                        "{disp.message}"
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-[#7A7167] pt-1 border-t border-[#E5E1D8]">
                        <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
                        <span>الموقع المستهدف: <strong>{disp.city}</strong> {disp.address ? `(${disp.address})` : ''}</span>
                      </div>
                    </div>

                    {/* Actions for the volunteer */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {disp.status === 'sent' && (
                        <>
                          <button
                            onClick={() => handleRespondDispatch(disp.id, 'declined')}
                            className="px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#7A7167] hover:bg-[#F5F2ED] transition"
                          >
                            اعتذار (غير متاح)
                          </button>
                          <button
                            onClick={() => handleRespondDispatch(disp.id, 'accepted')}
                            className="px-4 py-1.5 rounded-xl bg-[#D4A373] hover:bg-[#B88758] text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>قبول المهمة والمساعدة</span>
                          </button>
                        </>
                      )}

                      {disp.status === 'accepted' && (
                        <button
                          onClick={() => handleRespondDispatch(disp.id, 'completed')}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تأكيد إنجاز المهمة بنجاح</span>
                        </button>
                      )}

                      {disp.reportId && (
                        <button
                          onClick={() => onNavigate('report_details', disp.reportId)}
                          className="px-3 py-1.5 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] text-xs font-bold transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#D4A373]" />
                          <span>عرض البلاغ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FULL NOTIFICATIONS & LIVE ALERTS HUB */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden space-y-0">
            {/* Filter & Actions Bar */}
            <div className="p-4 sm:p-5 border-b border-[#F5F2ED] bg-[#FDFCF9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>تصفية الإشعارات:</span>
                </span>
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    notificationFilter === 'all'
                      ? 'bg-[#5B4D3F] text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    notificationFilter === 'unread'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  غير مقروءة ({unreadNotificationsCount})
                </button>
                <button
                  onClick={() => setNotificationFilter('urgent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    notificationFilter === 'urgent'
                      ? 'bg-red-700 text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  نداءات ومهام
                </button>
                <button
                  onClick={() => setNotificationFilter('updates')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    notificationFilter === 'updates'
                      ? 'bg-[#D4A373] text-white'
                      : 'bg-[#F5F2ED] text-[#7A7167] hover:text-[#5B4D3F]'
                  }`}
                >
                  تحديثات وإنجازات
                </button>
              </div>

              {unreadNotificationsCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2ED] hover:bg-[#E5E1D8] text-xs font-bold text-[#5B4D3F] transition"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-[#F5F2ED]">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Bell className="w-10 h-10 text-[#A0988E] mx-auto opacity-40" />
                  <h4 className="text-xs font-bold text-[#5B4D3F]">لا توجد إشعارات مطابقة</h4>
                  <p className="text-[11px] text-[#7A7167]">ستظهر هنا جميع التنبيهات ونداءات الاستجابة الميدانية وتحديثات البلاغات.</p>
                </div>
              ) : (
                filteredNotifications.map(notif => {
                  const title = language === 'ar' ? notif.titleAr : notif.titleFr;
                  const body = language === 'ar' ? notif.bodyAr : notif.bodyFr;

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 sm:p-5 transition flex flex-col sm:flex-row items-start justify-between gap-4 ${
                        !notif.isRead ? 'bg-emerald-50/40' : 'hover:bg-[#FDFCF9]'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-[#E5E1D8] shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-[#5B4D3F]">{title}</h4>
                            {!notif.isRead && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                جديد
                              </span>
                            )}
                            <span className="text-[10px] text-[#A0988E] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(notif.createdAt).toLocaleString('ar-SY')}</span>
                            </span>
                          </div>

                          <p className="text-xs text-[#2D2D2D] leading-relaxed whitespace-pre-line font-medium">
                            {body}
                          </p>

                          {notif.relatedReportId && (
                            <div className="pt-1">
                              <button
                                onClick={() => onNavigate('report_details', notif.relatedReportId)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4A373] hover:text-[#B88758] hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>عرض تفاصيل البلاغ المرتبط والتنسيق الميداني ←</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1.5 rounded-lg text-[#7A7167] hover:text-[#5B4D3F] hover:bg-[#F5F2ED] transition text-xs flex items-center gap-1"
                            title="تحديد كمقروء"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px]">تمت القراءة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
