import { VolunteerProfile, AnimalReport } from '../types';
import { POPULAR_SYRIAN_LOCATIONS } from './syriaLocations';

/**
 * Calculate Haversine distance in kilometers between two geo coordinates.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Format distance nicely in Arabic with km/meter units.
 */
export function formatDistanceAr(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} متر`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * Standard circle diameter presets for rescue operations (in km)
 */
export interface RadiusPreset {
  diameterKm: number;
  radiusKm: number;
  labelAr: string;
  subLabelAr: string;
}

export const RADIUS_PRESETS: RadiusPreset[] = [
  { diameterKm: 4, radiusKm: 2, labelAr: 'قطر 4 كم', subLabelAr: 'نطاق الحي المباشر (2 كم)' },
  { diameterKm: 10, radiusKm: 5, labelAr: 'قطر 10 كم', subLabelAr: 'المنطقة المحيطة (5 كم)' },
  { diameterKm: 20, radiusKm: 10, labelAr: 'قطر 20 كم', subLabelAr: 'المدينة وضواحيها (10 كم)' },
  { diameterKm: 40, radiusKm: 20, labelAr: 'قطر 40 كم', subLabelAr: 'المحافظة والريف القريب (20 كم)' },
  { diameterKm: 80, radiusKm: 40, labelAr: 'قطر 80 كم', subLabelAr: 'نطاق إقليمي واسع (40 كم)' },
  { diameterKm: 0, radiusKm: 9999, labelAr: 'كافة المتطوعين', subLabelAr: 'بدون تحديد مسافة' }
];

/**
 * Resolve realistic coordinates for a volunteer if not explicitly set.
 */
export function getVolunteerCoordinates(volunteer: VolunteerProfile): { lat: number; lng: number } {
  if (volunteer.lat && volunteer.lng) {
    return { lat: volunteer.lat, lng: volunteer.lng };
  }

  // Try matching popular location by city or neighborhood
  const match = POPULAR_SYRIAN_LOCATIONS.find(
    loc =>
      loc.governorateId === volunteer.governorate &&
      (loc.nameAr.includes(volunteer.city) ||
        (volunteer.neighborhood && loc.nameAr.includes(volunteer.neighborhood)) ||
        loc.cityNameAr.includes(volunteer.city))
  );

  if (match) {
    return { lat: match.lat, lng: match.lng };
  }

  // Fallback defaults per governorate
  const govDefaults: Record<string, { lat: number; lng: number }> = {
    damascus: { lat: 33.5138, lng: 36.2765 },
    rif_dimashq: { lat: 33.5100, lng: 36.3500 },
    aleppo: { lat: 36.2021, lng: 37.1343 },
    homs: { lat: 34.7324, lng: 36.7137 },
    hama: { lat: 35.1318, lng: 36.7578 },
    latakia: { lat: 35.5317, lng: 35.7901 },
    tartus: { lat: 34.8890, lng: 35.8866 },
    idlib: { lat: 35.9306, lng: 36.6339 },
    daraa: { lat: 32.6255, lng: 36.1054 },
    as_suwayda: { lat: 32.7089, lng: 36.5695 },
    quneitra: { lat: 33.1259, lng: 35.8246 },
    deir_ez_zor: { lat: 35.3359, lng: 40.1408 },
    ar_raqqah: { lat: 35.9594, lng: 39.0089 },
    al_hasakah: { lat: 36.5050, lng: 40.7450 }
  };

  return govDefaults[volunteer.governorate] || { lat: 33.5138, lng: 36.2765 };
}

/**
 * Filter and sort volunteers based on proximity to a center location within a specific radius.
 */
export interface VolunteerWithDistance extends VolunteerProfile {
  distanceKm: number;
  formattedDistance: string;
  isWithinCircle: boolean;
  computedLat: number;
  computedLng: number;
}

export function getVolunteersWithinRadius(
  volunteers: VolunteerProfile[],
  centerLat: number,
  centerLng: number,
  radiusKm: number // Half of diameter
): VolunteerWithDistance[] {
  return volunteers
    .map(vol => {
      const coords = getVolunteerCoordinates(vol);
      const distance = calculateDistanceKm(centerLat, centerLng, coords.lat, coords.lng);
      const isWithinCircle = radiusKm >= 9999 || distance <= radiusKm;

      return {
        ...vol,
        distanceKm: distance,
        formattedDistance: formatDistanceAr(distance),
        isWithinCircle,
        computedLat: coords.lat,
        computedLng: coords.lng
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
