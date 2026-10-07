import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  VolunteerProfile, 
  AnimalReport, 
  VolunteerRole, 
  VOLUNTEER_ROLE_DEFINITIONS 
} from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { 
  RADIUS_PRESETS, 
  getVolunteersWithinRadius, 
  VolunteerWithDistance 
} from '../../utils/geoUtils';
import { 
  X, 
  Send, 
  MapPin, 
  Phone, 
  Car, 
  HeartPulse, 
  Home, 
  CheckCircle2, 
  Radio, 
  Compass, 
  Sliders, 
  Check, 
  AlertTriangle,
  Users,
  Search,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface VolunteerRadiusDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: AnimalReport | null;
  reports?: AnimalReport[];
  initialRadiusKm?: number; // default 5 km (10 km diameter)
  onSuccess?: () => void;
}

export const VolunteerRadiusDispatchModal: React.FC<VolunteerRadiusDispatchModalProps> = ({
  isOpen,
  onClose,
  report,
  reports = [],
  initialRadiusKm = 5,
  onSuccess
}) => {
  const { responderProfile, user } = useAuth();

  // Active Report / Center location
  const [selectedReportId, setSelectedReportId] = useState<string>(report?.id || '');
  const activeReport = useMemo(() => {
    if (selectedReportId) {
      return reports.find(r => r.id === selectedReportId) || report || null;
    }
    return report || null;
  }, [selectedReportId, reports, report]);

  // Center Coordinates (defaults to Damascus center if no report)
  const centerLat = activeReport?.lat || 33.5138;
  const centerLng = activeReport?.lng || 36.2765;
  const centerLocationName = activeReport 
    ? `${activeReport.city} - ${activeReport.neighborhood || activeReport.exactAddress || activeReport.governorate}`
    : 'دمشق المركزية';

  // Radius / Diameter State
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm); // radius in km (diameter is 2 * radius)
  const diameterKm = radiusKm >= 9999 ? 'غير محدد (كافة المتطوعين)' : `${radiusKm * 2} كم`;

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [hasVehicleOnly, setHasVehicleOnly] = useState<boolean>(false);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection & Dispatch states
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [activeVolunteerDetail, setActiveVolunteerDetail] = useState<VolunteerWithDistance | null>(null);
  
  // Message & Dispatch Form
  const [dispatchRole, setDispatchRole] = useState<VolunteerRole>('transport');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'critical'>('urgent');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Volunteers State
  const [allVolunteers, setAllVolunteers] = useState<VolunteerProfile[]>(() => dataService.getAllVolunteers());

  useEffect(() => {
    setAllVolunteers(dataService.getAllVolunteers());
  }, [isOpen]);

  useEffect(() => {
    if (activeReport) {
      setDispatchMessage(`🚨 نداء استجابة لحالة [${activeReport.referenceNumber}]: ${activeReport.description.slice(0, 80)}... في ${activeReport.city}`);
    } else {
      setDispatchMessage('🚨 نداء استجابة وتنسيق ميداني عاجل من فريق الإنقاذ');
    }
  }, [activeReport]);

  // Compute all volunteers with real distance from incident center
  const calculatedVolunteers = useMemo(() => {
    return getVolunteersWithinRadius(allVolunteers, centerLat, centerLng, radiusKm);
  }, [allVolunteers, centerLat, centerLng, radiusKm]);

  // Filtered volunteers based on search and capabilities
  const displayedVolunteers = useMemo(() => {
    return calculatedVolunteers.filter(vol => {
      // Must be within circle if not unbounded
      if (!vol.isWithinCircle && radiusKm < 9999) return false;
      
      if (roleFilter !== 'all' && !vol.roles.includes(roleFilter as VolunteerRole)) return false;
      if (hasVehicleOnly && !vol.hasVehicle) return false;
      if (availableOnly && vol.availability !== 'available') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = vol.fullName.toLowerCase().includes(q);
        const matchCity = vol.city.toLowerCase().includes(q);
        const matchNeigh = (vol.neighborhood || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchNeigh) return false;
      }

      return true;
    });
  }, [calculatedVolunteers, radiusKm, roleFilter, hasVehicleOnly, availableOnly, searchQuery]);

  // Sync multi-selection with filtered list if "Select All"
  const handleSelectAllInCircle = () => {
    if (selectedVolunteerIds.length === displayedVolunteers.length && displayedVolunteers.length > 0) {
      setSelectedVolunteerIds([]);
    } else {
      setSelectedVolunteerIds(displayedVolunteers.map(v => v.id));
    }
  };

  const handleToggleVolunteerSelect = (volId: string) => {
    setSelectedVolunteerIds(prev => 
      prev.includes(volId) ? prev.filter(id => id !== volId) : [...prev, volId]
    );
  };

  // Initialize and Update Leaflet Mini-Map with Dynamic Radius Circle Overlay
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: radiusKm <= 5 ? 13 : radiusKm <= 15 ? 12 : radiusKm <= 30 ? 11 : 9,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 6
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([centerLat, centerLng], radiusKm <= 3 ? 14 : radiusKm <= 8 ? 13 : radiusKm <= 20 ? 11 : 9);

    // Clear previous markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // 1. Draw Incident / Request Location Center Marker
    const incidentIcon = L.divIcon({
      className: 'custom-incident-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-red-500/30 rounded-full animate-ping"></div>
          <div class="w-9 h-9 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-lg font-bold text-xs">
            🚨
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const incidentMarker = L.marker([centerLat, centerLng], { icon: incidentIcon });
    incidentMarker.bindPopup(`
      <div style="direction: rtl; text-align: right; font-family: system-ui, sans-serif; min-width: 180px;">
        <strong style="color: #991b1b; display: block; font-size: 13px;">📍 موقع البلاغ / المركز</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #444;">${centerLocationName}</p>
        ${activeReport ? `<span style="font-size: 10px; color: #777;">رقم: ${activeReport.referenceNumber}</span>` : ''}
      </div>
    `);
    markersLayerRef.current?.addLayer(incidentMarker);

    // 2. Draw Dynamic Geographic Circle Overlay
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }

    if (radiusKm < 9999) {
      const circle = L.circle([centerLat, centerLng], {
        radius: radiusKm * 1000, // in meters
        color: '#D4A373',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#D4A373',
        fillOpacity: 0.12
      }).addTo(map);

      circleLayerRef.current = circle;
    }

    // 3. Draw Markers for Volunteers
    calculatedVolunteers.forEach(vol => {
      const isInside = vol.isWithinCircle || radiusKm >= 9999;
      const isSelected = selectedVolunteerIds.includes(vol.id);

      const volIconHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-full ${
            isSelected 
              ? 'bg-emerald-600 border-2 border-white ring-2 ring-emerald-400' 
              : isInside 
                ? 'bg-[#5B4D3F] border-2 border-white' 
                : 'bg-stone-400 border border-stone-200 opacity-60'
          } text-white flex items-center justify-center shadow-md text-xs font-bold">
            ${vol.roles.includes('transport') ? '🚗' : vol.roles.includes('first_aid') ? '🩺' : '🏠'}
          </div>
          ${isInside ? `
            <span class="absolute -bottom-4 bg-white/95 text-[9px] font-bold px-1.5 py-0.2 rounded border border-stone-300 shadow-xs whitespace-nowrap text-stone-800">
              ${vol.formattedDistance}
            </span>
          ` : ''}
        </div>
      `;

      const volIcon = L.divIcon({
        className: 'custom-vol-pin',
        html: volIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const volMarker = L.marker([vol.computedLat, vol.computedLng], { icon: volIcon });
      volMarker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: system-ui, sans-serif; min-width: 200px;">
          <strong style="color: #5B4D3F; font-size: 13px;">${vol.fullName}</strong>
          <div style="margin: 3px 0; font-size: 11px; color: #16a34a; font-weight: bold;">
            📍 على بعد ${vol.formattedDistance} من موقع الحالة
          </div>
          <p style="margin: 2px 0; font-size: 11px; color: #666;">
            ${vol.city} - ${vol.neighborhood || ''}
          </p>
          <div style="margin-top: 6px; font-size: 10px; color: #888;">
            ${vol.roles.map(r => VOLUNTEER_ROLE_DEFINITIONS[r]?.shortLabelAr).join(' • ')}
          </div>
        </div>
      `);

      volMarker.on('click', () => {
        setActiveVolunteerDetail(vol);
      });

      markersLayerRef.current?.addLayer(volMarker);
    });

  }, [isOpen, centerLat, centerLng, radiusKm, calculatedVolunteers, selectedVolunteerIds]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Send Dispatch (Single or Batch)
  const handleSendDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchMessage.trim()) return;

    // Target recipients: selected volunteers, or active volunteer detail, or all in displayed list
    const targetIds = selectedVolunteerIds.length > 0 
      ? selectedVolunteerIds 
      : activeVolunteerDetail 
        ? [activeVolunteerDetail.id] 
        : displayedVolunteers.slice(0, 5).map(v => v.id);

    if (targetIds.length === 0) return;

    setIsSending(true);

    const senderName = responderProfile?.name || user?.fullName || 'فريق الاستجابة الميداني';
    const senderType = responderProfile?.responderType || 'association';

    await dataService.sendBatchVolunteerDispatches(targetIds, {
      senderId: responderProfile?.id || user?.id || 'sys_sender',
      senderName,
      senderType,
      reportId: activeReport?.id,
      reportReference: activeReport?.referenceNumber,
      roleNeeded: dispatchRole,
      urgencyLevel,
      message: dispatchMessage.trim(),
      governorate: activeReport?.governorate || 'damascus',
      city: activeReport?.city || 'دمشق',
      neighborhood: activeReport?.neighborhood,
      address: activeReport?.exactAddress || centerLocationName
    });

    setIsSending(false);
    setSuccessCount(targetIds.length);

    setTimeout(() => {
      setSuccessCount(null);
      onClose();
      if (onSuccess) onSuccess();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-[#E5E1D8] overflow-hidden relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#FDFCF9] border-b border-[#E5E1D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B4D3F] text-[#D4A373] flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#5B4D3F]">
                  طلب وتوزيع متطوعين ميدانيين حسب النطاق الجغرافي
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D4A373]" />
                  تحديد دائري ذكي
                </span>
              </div>
              <p className="text-xs text-[#7A7167]">
                حصر وعرض المتطوعين المتواجدين ضمن دائرة جغرافية محددة القطر حول موقع الحالة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5F2ED] hover:bg-[#E5E1D8] text-[#5B4D3F] flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          
          {/* SECTION 1: INCIDENT CENTER & DIAMETER CONTROLS */}
          <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5E1D8] space-y-4">
            
            {/* Top Bar: Incident Location + Quick Select Case */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#7A7167] block">نقطة المركز الجغرافي (موقع الحالة):</span>
                  <strong className="text-xs sm:text-sm text-[#5B4D3F]">
                    {centerLocationName}
                  </strong>
                  {activeReport && (
                    <span className="text-[10px] font-mono text-[#A0988E] mr-2 bg-white px-1.5 py-0.5 rounded border border-[#E5E1D8]">
                      [{activeReport.referenceNumber}]
                    </span>
                  )}
                </div>
              </div>

              {/* Case Switcher if reports are available */}
              {reports.length > 0 && (
                <div className="w-full md:w-auto">
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="w-full md:w-72 px-3 py-1.5 rounded-xl border border-[#E5E1D8] bg-white text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                  >
                    <option value="">-- تحديد حالة إسعافية كمركز للدائرة --</option>
                    {reports.map(r => (
                      <option key={r.id} value={r.id}>
                        [{r.referenceNumber}] {r.city} - {r.description.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* DIAMETER & RADIUS SELECTION CONTROLS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D4A373]" />
                  <span className="text-xs font-bold text-[#5B4D3F]">
                    تحديد قطر دائرة البحث الجغرافي:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#5B4D3F] bg-white px-3 py-1 rounded-xl border border-[#E5E1D8] shadow-2xs">
                    قطر الدائرة: <span className="text-[#D4A373]">{diameterKm}</span>
                    {radiusKm < 9999 && (
                      <span className="text-[10px] text-[#7A7167] font-normal mr-1">
                        (نصف القطر: {radiusKm} كم)
                      </span>
                    )}
                  </span>
                  
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    🟢 {displayedVolunteers.length} متطوع ضمن النطاق
                  </span>
                </div>
              </div>

              {/* Range Slider for continuous diameter adjustment */}
              <div className="pt-1 px-1">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={radiusKm >= 9999 ? 50 : radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full h-2 bg-[#E5E1D8] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                />
                <div className="flex justify-between text-[10px] text-[#A0988E] mt-1 font-mono">
                  <span>قطر 2 كم (1 كم)</span>
                  <span>قطر 20 كم (10 كم)</span>
                  <span>قطر 50 كم (25 كم)</span>
                  <span>قطر 100 كم (50 كم)</span>
                </div>
              </div>

              {/* Quick Preset Diameter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-[#7A7167]">خيارات سريعة لقطر الدائرة:</span>
                {RADIUS_PRESETS.map((preset) => {
                  const isActive = radiusKm === preset.radiusKm;
                  return (
                    <button
                      key={preset.diameterKm}
                      type="button"
                      onClick={() => setRadiusKm(preset.radiusKm)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#5B4D3F] text-white shadow-xs'
                          : 'bg-white text-[#5B4D3F] border border-[#E5E1D8] hover:bg-[#F5F2ED]'
                      }`}
                    >
                      <span>{preset.labelAr}</span>
                      <span className={`text-[10px] font-normal ${isActive ? 'text-[#D4A373]' : 'text-[#A0988E]'}`}>
                        ({preset.subLabelAr})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: SPLIT VIEW (INTERACTIVE MAP WITH CIRCLE + VOLUNTEERS LIST) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT / TOP: INTERACTIVE LEAFLET MAP WITH RADIUS CIRCLE */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#5B4D3F]">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>الرادار والخريطة التفاعلية للدائرة الجغرافية</span>
                </div>
                <span className="text-[10px] text-[#7A7167]">
                  انقر على أي متطوع لعرض بياناته
                </span>
              </div>

              {/* Map Container */}
              <div className="relative rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-inner bg-stone-100 h-72 sm:h-80 lg:h-96">
                <div ref={mapContainerRef} className="w-full h-full" />
                
                {/* Map Overlay Badge */}
                <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-stone-200 text-[10px] font-bold text-stone-700 shadow-xs flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D4A373]"></div>
                  <span>دائرة القطر: {diameterKm}</span>
                </div>
              </div>

              {/* Selected / Inspected Volunteer Quick Preview */}
              {activeVolunteerDetail && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-950 block">{activeVolunteerDetail.fullName}</span>
                    <span className="text-[11px] text-emerald-800">
                      📍 {activeVolunteerDetail.city} • على بعد <strong>{activeVolunteerDetail.formattedDistance}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${activeVolunteerDetail.phone}`}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      title="اتصال"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${activeVolunteerDetail.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                      title="واتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT / MAIN: VOLUNTEERS MATCHING LIST WITHIN CIRCLE */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Filter and Selection Header */}
              <div className="bg-white p-3 rounded-2xl border border-[#E5E1D8] space-y-2.5 shadow-xs">
                
                {/* Search and Role Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث بالاسم أو الحي..."
                      className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-[#E5E1D8] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#A0988E] absolute right-2.5 top-2 pointer-events-none" />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                  >
                    <option value="all">جميع مجالات المساعدة (All Roles)</option>
                    <option value="transport">🚗 النقل والإسعاف الميداني</option>
                    <option value="first_aid">🩹 إسعاف أولي بيطري</option>
                    <option value="temporary_shelter">🏠 استضافة ومأوى مؤقت (Foster)</option>
                    <option value="other">🤝 مساعدات أخرى</option>
                  </select>
                </div>

                {/* Quick Checkbox Toggles & Select All */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[#7A7167] pt-1 border-t border-[#F5F2ED]">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasVehicleOnly}
                        onChange={(e) => setHasVehicleOnly(e.target.checked)}
                        className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                      />
                      <span>مركبة نقل 🚗</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(e) => setAvailableOnly(e.target.checked)}
                        className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                      />
                      <span>متاح فوراً 🟢</span>
                    </label>
                  </div>

                  {displayedVolunteers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllInCircle}
                      className="text-xs font-bold text-[#D4A373] hover:text-[#C28E5A] transition"
                    >
                      {selectedVolunteerIds.length === displayedVolunteers.length 
                        ? 'إلغاء تحديد الكل' 
                        : `تحديد الكل (${displayedVolunteers.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* LIST OF VOLUNTEER CARDS WITHIN RADIUS */}
              <div className="space-y-2.5 max-h-80 sm:max-h-96 overflow-y-auto pr-1">
                {displayedVolunteers.length === 0 ? (
                  <div className="p-8 text-center bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8] space-y-2">
                    <Users className="w-8 h-8 text-[#A0988E] mx-auto opacity-50" />
                    <h4 className="text-xs font-bold text-[#5B4D3F]">
                      لم يتم العثور على متطوعين ضمن هذا القطر ({diameterKm})
                    </h4>
                    <p className="text-[11px] text-[#7A7167]">
                      قم بزيادة قطر الدائرة من شريط التمرير أعلاه (مثلاً 20 كم أو 40 كم) لتوسيع نطاق البحث.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRadiusKm(20)}
                      className="mt-2 px-3 py-1.5 bg-[#5B4D3F] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      توسيع القطر إلى 40 كم (نطاق 20 كم)
                    </button>
                  </div>
                ) : (
                  displayedVolunteers.map(vol => {
                    const isSelected = selectedVolunteerIds.includes(vol.id);
                    const isAvail = vol.availability === 'available';

                    return (
                      <div
                        key={vol.id}
                        onClick={() => setActiveVolunteerDetail(vol)}
                        className={`p-3.5 rounded-2xl border transition relative cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300'
                            : 'bg-white border-[#E5E1D8] hover:border-[#D4A373] hover:bg-[#FDFCF9]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Selection Checkbox & Volunteer Info */}
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleVolunteerSelect(vol.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 w-4 h-4 rounded text-[#D4A373] focus:ring-[#D4A373] cursor-pointer"
                            />

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-[#5B4D3F]">
                                  {vol.fullName}
                                </h4>
                                
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isAvail 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {isAvail ? '🟢 متاح الآن' : '🟡 عند التنسيق'}
                                </span>

                                <span className="text-[11px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  📍 على بعد {vol.formattedDistance}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#7A7167] flex items-center gap-1">
                                <span>{vol.governorate} - {vol.city} {vol.neighborhood ? `(${vol.neighborhood})` : ''}</span>
                              </div>

                              {/* Roles Badges */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {vol.roles.map(r => (
                                  <span key={r} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8]">
                                    {VOLUNTEER_ROLE_DEFINITIONS[r]?.shortLabelAr}
                                  </span>
                                ))}
                                {vol.hasVehicle && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                    🚗 {vol.vehicleType || 'مركبة'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Direct Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`tel:${vol.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl bg-[#F5F2ED] hover:bg-emerald-50 hover:text-emerald-700 text-[#5B4D3F] border border-[#E5E1D8] transition"
                              title="اتصال مباشر"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${vol.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl bg-[#F5F2ED] hover:bg-green-50 hover:text-green-700 text-[#5B4D3F] border border-[#E5E1D8] transition"
                              title="محادثة واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: DISPATCH REQUEST FORM & BROADCAST SUBMIT */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#F5F2ED] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#D4A373]" />
                <h4 className="text-xs sm:text-sm font-bold text-[#5B4D3F]">
                  إرسال نداء الاستجابة للمتطوعين المحددين
                </h4>
              </div>

              <span className="text-xs font-bold text-[#5B4D3F] bg-[#F5F2ED] px-3 py-1 rounded-xl">
                المستلمون: {selectedVolunteerIds.length > 0 
                  ? `${selectedVolunteerIds.length} متطوع محدد` 
                  : activeVolunteerDetail 
                    ? `المتطوع ${activeVolunteerDetail.fullName}` 
                    : `أقرب ${Math.min(displayedVolunteers.length, 5)} متطوعين تلقائياً`}
              </span>
            </div>

            {successCount !== null ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="text-xs sm:text-sm font-bold text-emerald-950">
                  تم إرسال نداء الاستجابة بنجاح إلى {successCount} متطوع!
                </h5>
                <p className="text-[11px] text-emerald-800">
                  سيصلهم إشعار فوري وتنبيه في لوحة التحكم وتطبيق المتطوعين لبدء التحرك.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendDispatch} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                      نوع المساعدة المطلوبة في الميدان: *
                    </label>
                    <select
                      value={dispatchRole}
                      onChange={(e) => setDispatchRole(e.target.value as VolunteerRole)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                    >
                      <option value="transport">🚗 نقل وإسعاف الحيوان للمشفى/العيادة</option>
                      <option value="first_aid">🩹 تقديم إسعاف أولي ميداني فوري</option>
                      <option value="temporary_shelter">🏠 تأمين استضافة مؤقتة (Foster)</option>
                      <option value="other">🤝 مساعدة ميدانية ولوجستية عامة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                      مستوى الأهمية والاستعجال:
                    </label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                    >
                      <option value="critical">🚨 حرج وطارئ جداً (حياة الحيوان في خطر)</option>
                      <option value="urgent">⚠️ عاجل (خلال ساعات قليلة)</option>
                      <option value="normal">🟢 عادي (تنسيق خلال اليوم)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B4D3F] mb-1">
                    نص نداء الاستجابة وتفاصيل الموقع: *
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchMessage}
                    onChange={(e) => setDispatchMessage(e.target.value)}
                    placeholder="اكتب تفاصيل الحالة والإرشادات للمتطوع..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#7A7167] hover:bg-[#F5F2ED]"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || displayedVolunteers.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSending 
                        ? 'جاري إرسال النداءات...' 
                        : selectedVolunteerIds.length > 1 
                          ? `إرسال نداء جماعي (${selectedVolunteerIds.length} متطوع)`
                          : 'إرسال نداء الاستجابة الفوري'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
