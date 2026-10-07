import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { useLanguage } from '../../context/LanguageContext';
import { SYRIAN_GOVERNORATES } from '../../types';
import { 
  POPULAR_SYRIAN_LOCATIONS, 
  searchNominatimSyria, 
  reverseGeocodeSyria,
  SyrianLocationItem,
  GeocodedAddressResult
} from '../../utils/syriaLocations';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Loader2, 
  X, 
  Check, 
  Sparkles,
  Compass,
  MapPinned
} from 'lucide-react';

export interface LocationSelectDetails {
  governorateId?: string;
  governorateNameAr?: string;
  city?: string;
  neighborhood?: string;
  areaName?: string;
  road?: string;
  exactAddress?: string;
  fullAddress?: string;
}

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  governorateId?: string;
  onLocationChange: (lat: number, lng: number) => void;
  onLocationSelectDetails?: (details: LocationSelectDetails) => void;
  height?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat = 33.5138,
  initialLng = 36.2765,
  governorateId,
  onLocationChange,
  onLocationSelectDetails,
  height = '360px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { t, isRtl } = useLanguage();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  
  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onlineResults, setOnlineResults] = useState<SyrianLocationItem[]>([]);
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Resolve address coordinates helper
  const handleResolveCoords = useCallback(async (lat: number, lng: number, manualAreaName?: string) => {
    setIsResolvingAddress(true);
    try {
      const result: GeocodedAddressResult = await reverseGeocodeSyria(lat, lng);
      
      const displayName = manualAreaName || result.areaName || result.neighborhood || `${result.city}`;
      setSelectedAreaName(displayName);
      setResolvedAddress(result.exactAddress || `${result.city} - ${result.neighborhood}`);

      if (onLocationSelectDetails) {
        onLocationSelectDetails({
          governorateId: result.governorateId,
          governorateNameAr: result.governorateNameAr,
          city: result.city,
          neighborhood: result.neighborhood,
          road: result.road,
          areaName: displayName,
          exactAddress: result.exactAddress || `${result.city} - ${result.neighborhood}`,
          fullAddress: result.fullAddress
        });
      }
    } catch {
      // Fallback silently if resolution errors
    } finally {
      setIsResolvingAddress(false);
    }
  }, [onLocationSelectDetails]);

  // Filter local directory based on search query
  const localMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_SYRIAN_LOCATIONS.filter(item => 
      item.nameAr.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.cityNameAr.toLowerCase().includes(q) ||
      item.governorateNameAr.toLowerCase().includes(q) ||
      (item.neighborhoodNameAr && item.neighborhoodNameAr.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery]);

  // Quick area chips for the current governorate
  const currentGovChips = useMemo(() => {
    if (!governorateId) return [];
    return POPULAR_SYRIAN_LOCATIONS.filter(item => item.governorateId === governorateId).slice(0, 6);
  }, [governorateId]);

  // Debounced search for Nominatim if query is longer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setOnlineResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchNominatimSyria(searchQuery);
      setOnlineResults(results);
      setIsSearching(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: isRtl ? 'topleft' : 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 6,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Pin Marker
      const customPinIcon = L.divIcon({
        className: 'location-pin-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            cursor: grab;
          ">
            <div style="
              width: 34px;
              height: 34px;
              background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 6px 14px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 14px; color: white;">📍</span>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        setCoords({ lat: newPos.lat, lng: newPos.lng });
        onLocationChange(newPos.lat, newPos.lng);
        handleResolveCoords(newPos.lat, newPos.lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        onLocationChange(lat, lng);
        handleResolveCoords(lat, lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Initial address resolution
      handleResolveCoords(initialLat, initialLng);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center on selected governorate if user changes dropdown
  useEffect(() => {
    if (governorateId && mapInstanceRef.current && markerRef.current) {
      const gov = SYRIAN_GOVERNORATES.find(g => g.id === governorateId);
      if (gov) {
        mapInstanceRef.current.setView([gov.lat, gov.lng], gov.zoom || 13, { animate: true });
        markerRef.current.setLatLng([gov.lat, gov.lng]);
        setCoords({ lat: gov.lat, lng: gov.lng });
        onLocationChange(gov.lat, gov.lng);
        handleResolveCoords(gov.lat, gov.lng, gov.nameAr);
      }
    }
  }, [governorateId]);

  // Handler for selecting an area from search / chips
  const handleSelectLocation = (item: SyrianLocationItem) => {
    if (mapInstanceRef.current && markerRef.current) {
      const targetZoom = item.zoom || 15;
      mapInstanceRef.current.flyTo([item.lat, item.lng], targetZoom, {
        duration: 1.2,
      });
      markerRef.current.setLatLng([item.lat, item.lng]);
      setCoords({ lat: item.lat, lng: item.lng });
      onLocationChange(item.lat, item.lng);

      const formattedExact = `${item.cityNameAr} - ${item.neighborhoodNameAr || item.nameAr} (${item.governorateNameAr})`;
      setSelectedAreaName(item.nameAr);
      setResolvedAddress(formattedExact);
      setSearchQuery('');
      setIsDropdownOpen(false);

      if (onLocationSelectDetails) {
        onLocationSelectDetails({
          governorateId: item.governorateId !== 'custom' ? item.governorateId : undefined,
          governorateNameAr: item.governorateNameAr,
          city: item.cityNameAr,
          neighborhood: item.neighborhoodNameAr || item.nameAr,
          areaName: item.nameAr,
          exactAddress: `${item.cityNameAr} - ${item.neighborhoodNameAr || item.nameAr}`,
          fullAddress: formattedExact
        });
      }
    }
  };

  // Handler for GPS auto-geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('خاصية تحديد الموقع غير مدعومة في متصفحك.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.4 });
          markerRef.current.setLatLng([latitude, longitude]);
          setCoords({ lat: latitude, lng: longitude });
          onLocationChange(latitude, longitude);
          handleResolveCoords(latitude, longitude, 'موقعي الحالي عبر GPS');
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocateError('يرجى السماح بصلاحية الموقع من إعدادات المتصفح.');
        } else {
          setLocateError('تعذر تحديد الموقع تلقائياً، يرجى البحث أو النقر على الخريطة.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Combine local and online search suggestions
  const allSuggestions = [
    ...localMatches,
    ...onlineResults.filter(o => !localMatches.some(l => Math.abs(l.lat - o.lat) < 0.001 && Math.abs(l.lng - o.lng) < 0.001))
  ];

  return (
    <div className="space-y-2.5">
      {/* 1. SEARCH BAR & GPS ACTION */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex gap-2">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#7A7167]">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#D4A373] animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-[#7A7167]" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="ابحث عن اسم الحي، الشارع، الساحة أو المنطقة (مثال: المزة، الفرقان، الشعلان...)"
              className="w-full pr-10 pl-9 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:border-transparent placeholder-[#7A7167]/70 shadow-2xs"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setOnlineResults([]);
                }}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7A7167] hover:text-[#2D2D2D]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Locate Me GPS Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] hover:bg-[#F5F2ED] text-[#5B4D3F] text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95 disabled:opacity-50"
            title="تحديد موقعي التلقائي عبر GPS"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 text-[#D4A373] animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-[#D4A373]" />
            )}
            <span className="hidden sm:inline">موقعي الحالي</span>
          </button>
        </div>

        {/* Dropdown Suggestions List */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full right-0 left-0 mt-1.5 z-40 bg-white border border-[#E5E1D8] rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-[#F5F2ED] animate-in fade-in zoom-in-95 duration-150">
            {allSuggestions.length > 0 ? (
              allSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectLocation(item)}
                  className="w-full px-4 py-3 text-right hover:bg-[#F9F7F2] transition flex items-center justify-between gap-3 text-xs group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-[#F5F2ED] text-[#5B4D3F] group-hover:bg-[#D4A373] group-hover:text-white flex items-center justify-center shrink-0 transition">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[#5B4D3F] group-hover:text-[#2D2D2D] truncate">
                        {item.nameAr}
                      </p>
                      <p className="text-[11px] text-[#7A7167] truncate">
                        {item.cityNameAr ? `${item.cityNameAr} • ` : ''}{item.governorateNameAr}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#D4A373] font-semibold shrink-0 group-hover:underline flex items-center gap-1">
                    انتقال للخريطة 🎯
                  </span>
                </button>
              ))
            ) : isSearching ? (
              <div className="p-4 text-center text-xs text-[#7A7167] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-[#D4A373] animate-spin" />
                <span>جاري البحث في خريطة سورية والمناطق المحيطة...</span>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#7A7167]">
                لم يتم العثور على منطقة مطابقة لـ "{searchQuery}". يمكنك النقر مباشرة على الخريطة لتثبيت النقطة.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. POPULAR AREA QUICK CHIPS (For active governorate) */}
      {currentGovChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#5B4D3F] shrink-0">
            <Compass className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>أحياء سريعة:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {currentGovChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSelectLocation(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                  selectedAreaName === chip.nameAr
                    ? 'bg-[#5B4D3F] text-white border-[#5B4D3F] font-bold shadow-2xs'
                    : 'bg-white border-[#E5E1D8] text-[#5B4D3F] hover:bg-[#F5F2ED] hover:border-[#D4A373]'
                }`}
              >
                {chip.neighborhoodNameAr || chip.nameAr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geolocation error feedback */}
      {locateError && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg animate-in fade-in">
          ⚠️ {locateError}
        </p>
      )}

      {/* 3. MAP CANVAS */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-xs" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Floating Instruction Overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none flex justify-between items-center">
          <div className="bg-[#2D2D2D]/85 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-xl shadow-md pointer-events-auto flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>اسحب الدبوس 📍 أو انقر على أي موقع لتحديث العنوان تلقائياً</span>
          </div>
        </div>
      </div>

      {/* 4. ADDRESS RESOLVED & COORDINATES FOOTER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F9F7F2] rounded-xl border border-[#E5E1D8] text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-lg bg-[#D4A373]/20 text-[#5B4D3F] flex items-center justify-center shrink-0">
              <MapPinned className="w-3.5 h-3.5 text-[#D4A373]" />
            </div>
            <div className="truncate">
              <span className="text-[11px] text-[#7A7167]">الموقع المختار على الخريطة: </span>
              <strong className="text-[#5B4D3F]">
                {isResolvingAddress ? (
                  <span className="inline-flex items-center gap-1 text-[#D4A373]">
                    <Loader2 className="w-3 h-3 animate-spin inline" /> جاري قراءة العنوان...
                  </span>
                ) : (
                  resolvedAddress || selectedAreaName || 'موقع محدد على الخريطة'
                )}
              </strong>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">متزامن مع العنوان</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#7A7167] px-1">
          <div className="flex items-center gap-3">
            <span>خط العرض (Lat): <strong className="text-[#5B4D3F] font-mono">{coords.lat.toFixed(5)}</strong></span>
            <span>خط الطول (Lng): <strong className="text-[#5B4D3F] font-mono">{coords.lng.toFixed(5)}</strong></span>
          </div>
          <span className="text-[11px] text-[#7A7167] hidden sm:inline">
            يتم تحديث صندوق العنوان فورياً
          </span>
        </div>
      </div>
    </div>
  );
};
