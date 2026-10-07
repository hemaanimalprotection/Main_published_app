import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AnimalReport, SeverityLevel, ReportStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SyriaLeafletMapProps {
  reports: AnimalReport[];
  selectedReportId?: string | null;
  onSelectReport?: (report: AnimalReport) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  isOperational?: boolean;
}

export const SyriaLeafletMap: React.FC<SyriaLeafletMapProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  center = [34.9, 38.2], // Center of Syria
  zoom = 7,
  height = '500px',
  isOperational = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const { language, t, isRtl } = useLanguage();

  // Color generator for status and severity
  const getMarkerColor = (report: AnimalReport): { bg: string; border: string; pulse: boolean } => {
    if (report.severity === 'critical' && !report.isAssigned) {
      return { bg: '#dc2626', border: '#991b1b', pulse: true }; // Urgent Red
    }
    if (report.status === 'waiting_responder' || !report.isAssigned) {
      return { bg: '#f59e0b', border: '#b45309', pulse: false }; // Amber Warning
    }
    if (report.status === 'responsibility_accepted' || report.status === 'responder_on_way') {
      return { bg: '#2563eb', border: '#1d4ed8', pulse: false }; // Blue Active
    }
    if (report.status === 'receiving_veterinary_care') {
      return { bg: '#0d9488', border: '#0f766e', pulse: false }; // Teal Vet Care
    }
    if (report.status === 'sheltered_or_fostered') {
      return { bg: '#7c3aed', border: '#6d28d9', pulse: false }; // Purple Shelter
    }
    if (report.status === 'resolved' || report.status === 'adoption_process') {
      return { bg: '#16a34a', border: '#15803d', pulse: false }; // Green Resolved
    }
    return { bg: '#64748b', border: '#475569', pulse: false }; // Gray Default
  };

  const getAnimalIconSymbol = (type: string) => {
    switch (type) {
      case 'dog': return '🐕';
      case 'cat': return '🐈';
      case 'horse_donkey': return '🐎';
      case 'bird': return '🕊️';
      case 'farm_animal': return '🐑';
      default: return '🐾';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet Map Instance
      const map = L.map(mapContainerRef.current, {
        center: center as [number, number],
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control on preferred side
      L.control.zoom({ position: isRtl ? 'topleft' : 'topright' }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 6,
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap contributors | Hema Syria' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when governorate center or zoom props update (e.g. Association's initial governorate)
  useEffect(() => {
    if (mapInstanceRef.current && center && !selectedReportId) {
      mapInstanceRef.current.setView(center as [number, number], zoom || 11, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom, selectedReportId]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    reports.forEach((report) => {
      const { bg, border, pulse } = getMarkerColor(report);
      const isSelected = selectedReportId === report.id;
      const iconSymbol = getAnimalIconSymbol(report.animalType);

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-hema-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
            ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: ${bg}; opacity: 0.4; animation: pulse-emergency 1.6s infinite;"></div>` : ''}
            <div style="
              width: ${isSelected ? '36px' : '30px'};
              height: ${isSelected ? '36px' : '30px'};
              background-color: ${bg};
              border: 2.5px solid ${isSelected ? '#ffffff' : border};
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isSelected ? '16px' : '14px'};
              color: white;
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${iconSymbol}
            </div>
            <div style="
              position: absolute;
              bottom: -4px;
              width: 0; 
              height: 0; 
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${bg};
            "></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon });

      // Build popup content
      const statusLabel = (t as any)[`st_${report.status}`] || report.status;
      const severityLabel = (t as any)[`sev_${report.severity}`] || report.severity;
      const assignedText = report.isAssigned && report.leadResponderName
        ? `<div style="color: #1d4ed8; font-weight: 600; margin-top: 4px;">🩺 ${report.leadResponderName}</div>`
        : `<div style="color: #b45309; font-weight: 600; margin-top: 4px;">⏳ ${t.unassignedCases}</div>`;

      const popupHtml = `
        <div style="font-family: inherit; width: 220px; padding: 12px; direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; color: #1c1917; font-size: 13px;">${report.referenceNumber}</span>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background-color: ${bg}20; color: ${bg}; font-weight: 700;">${severityLabel.split('/')[0]}</span>
          </div>
          <p style="font-size: 12px; color: #44403c; margin: 4px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${report.description}
          </p>
          <div style="font-size: 11px; color: #78716c; margin-top: 4px;">
            📍 ${report.neighborhood}, ${report.city}
          </div>
          ${assignedText}
          <button id="btn-popup-${report.id}" style="
            width: 100%;
            margin-top: 8px;
            padding: 6px;
            background-color: #059669;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          ">
            ${t.details}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${report.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectReport) onSelectReport(report);
          };
        }
      });

      marker.on('click', () => {
        if (onSelectReport) onSelectReport(report);
      });

      markersGroup.addLayer(marker);

      if (isSelected && mapInstanceRef.current) {
        mapInstanceRef.current.setView([report.lat, report.lng], Math.max(map.getZoom(), 12), { animate: true });
        marker.openPopup();
      }
    });
  }, [reports, selectedReportId, language]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-stone-200" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Overlay */}
      <div className={`absolute bottom-3 ${isRtl ? 'right-3' : 'left-3'} z-20 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-stone-200 shadow-md text-xs space-y-1.5 hidden sm:block`}>
        <div className="font-bold text-stone-800 border-b border-stone-100 pb-1 flex items-center justify-between gap-4">
          <span>دليل الحالات العملياتية</span>
          <span className="text-[10px] text-stone-400">سورية</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-stone-600">حرج وشاغر (استغاثة فورية)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-stone-600">بانتظار استجابة</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span className="text-stone-600">تم قبول المسؤولية / في الطريق</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
          <span className="text-stone-600">يتلقى الرعاية البيطرية</span>
        </div>
      </div>
    </div>
  );
};
