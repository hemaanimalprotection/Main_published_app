/**
 * Official OpenStreetMap (OSM) Reference Points for all 14 Governorates & Capital Cities of Syria.
 * Grounded in OpenStreetMap geographic nodes and administrative reference coordinates.
 */

export interface SyrianCityOsmReference {
  id: string; // Standard governorate ID
  cityNameAr: string;
  cityNameEn: string;
  governorateNameAr: string;
  lat: number;
  lng: number;
  zoom: number; // Recommended zoom for city operations
  osmNodeUrl?: string;
  keyLandmarkAr: string;
  aliases: string[];
}

/**
 * OpenStreetMap reference points for the 14 cities/governorates of Syria:
 * 1. As-Suwayda / Sweida (السويداء) - OSM Node / Al-Seer Square
 * 2. Damascus (دمشق) - OSM Node / Marjeh Square & City Centre
 * 3. Rif Dimashq (ريف دمشق) - Douma & Central Metropolitan Area
 * 4. Aleppo (حلب) - OSM Node / Saadallah Al-Jabiri & City Centre
 * 5. Homs (حمص) - OSM Node / Al-Sa'ah Clock & Dablan
 * 6. Hama (حماة) - OSM Node / Al-Assi Square & Norias
 * 7. Latakia (اللاذقية) - OSM Node / Sheikh Daher & Port City Centre
 * 8. Tartus (طرطوس) - OSM Node / Sea Corniche & City Centre
 * 9. Idlib (إدلب) - OSM Node / City Clock & Central Idlib
 * 10. Daraa (درعا) - OSM Node / Al-Mahatta & Central Daraa
 * 11. Quneitra (القنيطرة) - Madinat Al-Baath Administrative Center
 * 12. Deir ez-Zor (دير الزور) - OSM Node / Suspension Bridge & Central Deir ez-Zor
 * 13. Raqqa (الرقة) - OSM Node / Al-Naim Square & City Clock
 * 14. Al-Hasakah (الحسكة) - OSM Node / Khabur & Central Hasakah
 */
export const SYRIA_14_CITIES_OSM_REFERENCES: SyrianCityOsmReference[] = [
  // 1. As-Suwayda / Sweida (السويداء)
  {
    id: 'as_suwayda',
    cityNameAr: 'السويداء',
    cityNameEn: 'As-Suwayda',
    governorateNameAr: 'السويداء',
    lat: 32.7090,
    lng: 36.5695,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/node/26899757',
    keyLandmarkAr: 'ساحة السير / وسط مدينة السويداء',
    aliases: [
      'as_suwayda', 'as-suwayda', 'as suwayda', 'suwayda', 'sweida', 'sweda', 
      'soueida', 'soueïda', 'swd', 'السويداء', 'سويداء', 'السويداء المدينة', 
      'مدينة السويداء', 'محافظة السويداء', 'جبل العرب'
    ]
  },

  // 2. Damascus (دمشق)
  {
    id: 'damascus',
    cityNameAr: 'دمشق',
    cityNameEn: 'Damascus',
    governorateNameAr: 'دمشق',
    lat: 33.5138,
    lng: 36.2765,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306487',
    keyLandmarkAr: 'وسط دمشق / ساحة الأمويين وساحة المرجة',
    aliases: [
      'damascus', 'dimashq', 'damas', 'dam', 'دمشق', 'دمشق المدينة', 
      'مدينة دمشق', 'محافظة دمشق', 'الشام', 'شام', 'العاصمة دمشق'
    ]
  },

  // 3. Rif Dimashq / Rural Damascus (ريف دمشق)
  {
    id: 'rif_dimashq',
    cityNameAr: 'دوما (ريف دمشق)',
    cityNameEn: 'Rif Dimashq',
    governorateNameAr: 'ريف دمشق',
    lat: 33.5714,
    lng: 36.4028,
    zoom: 13,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306488',
    keyLandmarkAr: 'دوما / الغوطة / جرمانا / ريف دمشق',
    aliases: [
      'rif_dimashq', 'rif-dimashq', 'rif dimashq', 'rural damascus', 'rif', 
      'ريف دمشق', 'ريف دمشق', 'محافظة ريف دمشق', 'دوما', 'جرمانا', 'صحنايا', 
      'قدسيا', 'الزبداني', 'الكسوة', 'يبرود', 'النبك', 'قطنا'
    ]
  },

  // 4. Aleppo (حلب)
  {
    id: 'aleppo',
    cityNameAr: 'حلب',
    cityNameEn: 'Aleppo',
    governorateNameAr: 'حلب',
    lat: 36.2021,
    lng: 37.1343,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306486',
    keyLandmarkAr: 'ساحة سعد الله الجابري / قلعة حلب',
    aliases: [
      'aleppo', 'alep', 'halab', 'alp', 'حلب', 'حلب المدينة', 
      'مدينة حلب', 'محافظة حلب', 'الشهباء', 'عفرين', 'منبج', 'اعزاز'
    ]
  },

  // 5. Homs (حمص)
  {
    id: 'homs',
    cityNameAr: 'حمص',
    cityNameEn: 'Homs',
    governorateNameAr: 'حمص',
    lat: 34.7324,
    lng: 36.7137,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306489',
    keyLandmarkAr: 'ساحة الساعة الجديدة / الدبلان / وسط حمص',
    aliases: [
      'homs', 'hims', 'hms', 'حمص', 'حمص المدينة', 
      'مدينة حمص', 'محافظة حمص', 'الإنشاءات', 'الوعر', 'تدمر', 'القصير'
    ]
  },

  // 6. Hama (حماة)
  {
    id: 'hama',
    cityNameAr: 'حماة',
    cityNameEn: 'Hama',
    governorateNameAr: 'حماة',
    lat: 35.1318,
    lng: 36.7578,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306490',
    keyLandmarkAr: 'ساحة العاصي / نواعير حماة / وسط حماة',
    aliases: [
      'hama', 'hamah', 'hma', 'حماة', 'حماه', 'حماة المدينة', 
      'مدينة حماة', 'محافظة حماة', 'السلمية', 'مصياف', 'محردة'
    ]
  },

  // 7. Latakia (اللاذقية)
  {
    id: 'latakia',
    cityNameAr: 'اللاذقية',
    cityNameEn: 'Latakia',
    governorateNameAr: 'اللاذقية',
    lat: 35.5317,
    lng: 35.7909,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306491',
    keyLandmarkAr: 'ساحة الشيخ ضاهر / مشروع الزراعة / الكورنيش',
    aliases: [
      'latakia', 'lattakia', 'lattaquie', 'lattaquié', 'lat', 
      'اللاذقية', 'اللاذقيه', 'لاذقية', 'اللاذقية المدينة', 
      'مدينة اللاذقية', 'محافظة اللاذقية', 'جبلة', 'القرداحة', 'كسب'
    ]
  },

  // 8. Tartus (طرطوس)
  {
    id: 'tartus',
    cityNameAr: 'طرطوس',
    cityNameEn: 'Tartus',
    governorateNameAr: 'طرطوس',
    lat: 34.8890,
    lng: 35.8866,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306492',
    keyLandmarkAr: 'الكورنيش البحري / وسط مدينة طرطوس',
    aliases: [
      'tartus', 'tartous', 'tar', 'طرطوس', 'طرطوس المدينة', 
      'مدينة طرطوس', 'محافظة طرطوس', 'بانياس', 'صافيتا', 'دريكيش'
    ]
  },

  // 9. Idlib (إدلب)
  {
    id: 'idlib',
    cityNameAr: 'إدلب',
    cityNameEn: 'Idlib',
    governorateNameAr: 'إدلب',
    lat: 35.9306,
    lng: 36.6339,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306493',
    keyLandmarkAr: 'ساحة الساعة / وسط مدينة إدلب',
    aliases: [
      'idlib', 'idleb', 'edlib', 'idb', 'إدلب', 'ادلب', 
      'إدلب المدينة', 'ادلب المدينة', 'مدينة إدلب', 'محافظة إدلب', 
      'معرة النعمان', 'أريحا', 'جسر الشغور', 'سرمدا'
    ]
  },

  // 10. Daraa (درعا)
  {
    id: 'daraa',
    cityNameAr: 'درعا',
    cityNameEn: 'Daraa',
    governorateNameAr: 'درعا',
    lat: 32.6255,
    lng: 36.1051,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306494',
    keyLandmarkAr: 'درعا المحطة / وسط مدينة درعا',
    aliases: [
      'daraa', 'dara', 'dar\'a', 'dar', 'درعا', 'درعا المدينة', 
      'مدينة درعا', 'محافظة درعا', 'درعا المحطة', 'إزرع', 'الصنمين', 'نوى', 'بصرى الشام'
    ]
  },

  // 11. Quneitra (القنيطرة)
  {
    id: 'quneitra',
    cityNameAr: 'القنيطرة (مدينة البعث)',
    cityNameEn: 'Quneitra',
    governorateNameAr: 'القنيطرة',
    lat: 33.1780,
    lng: 35.8750,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306495',
    keyLandmarkAr: 'مدينة البعث / مركز محافظة القنيطرة',
    aliases: [
      'quneitra', 'qunaytira', 'qouneitra', 'qun', 'القنيطرة', 'القنيطره', 
      'قنيطرة', 'مدينة القنيطرة', 'محافظة القنيطرة', 'مدينة البعث', 'خان أرنبة'
    ]
  },

  // 12. Deir ez-Zor (دير الزور)
  {
    id: 'deir_ez_zor',
    cityNameAr: 'دير الزور',
    cityNameEn: 'Deir ez-Zor',
    governorateNameAr: 'دير الزور',
    lat: 35.3359,
    lng: 40.1408,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306496',
    keyLandmarkAr: 'الجسر المعلق / ضفاف الفرات / وسط دير الزور',
    aliases: [
      'deir_ez_zor', 'deir-ez-zor', 'deir ez-zor', 'deir ez zor', 'deir ezzor', 
      'dayr al-zawr', 'dez', 'دير الزور', 'ديرالزور', 'دير الزور المدينة', 
      'مدينة دير الزور', 'محافظة دير الزور', 'الميادين', 'البوكمال'
    ]
  },

  // 13. Raqqa (الرقة)
  {
    id: 'raqqa',
    cityNameAr: 'الرقة',
    cityNameEn: 'Raqqa',
    governorateNameAr: 'الرقة',
    lat: 35.9594,
    lng: 39.0089,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306497',
    keyLandmarkAr: 'دوار النعيم / ساحة الساعة / وسط مدينة الرقة',
    aliases: [
      'raqqa', 'raqqah', 'ar-raqqa', 'ar-raqqah', 'raq', 'الرقة', 'الرقه', 
      'رقة', 'الرقة المدينة', 'مدينة الرقة', 'محافظة الرقة', 'الطبقة', 'تل أبيض'
    ]
  },

  // 14. Al-Hasakah (الحسكة)
  {
    id: 'al_hasakah',
    cityNameAr: 'الحسكة',
    cityNameEn: 'Al-Hasakah',
    governorateNameAr: 'الحسكة',
    lat: 36.5050,
    lng: 40.7450,
    zoom: 14,
    osmNodeUrl: 'https://www.openstreetmap.org/relation/306498',
    keyLandmarkAr: 'مركز مدينة الحسكة / ضفاف الخابور',
    aliases: [
      'al_hasakah', 'al-hasakah', 'al hasakah', 'hasakah', 'hasakeh', 
      'hassake', 'hassaké', 'al-hasakeh', 'has', 'الحسكة', 'الحسكه', 
      'حسكة', 'الحسكة المدينة', 'مدينة الحسكة', 'محافظة الحسكة', 
      'القامشلي', 'qamishli', 'المالكية', 'عامودا', 'رأس العين'
    ]
  }
];

/**
 * Normalize an Arabic or Latin text string for robust matching.
 */
function normalizeLocString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[_\-–—/\\,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves the OpenStreetMap reference point for any Syrian city or governorate.
 * Checks city name, governorate ID, Arabic names, French/English names, and common aliases.
 * 
 * Returns the exact OpenStreetMap coordinates [lat, lng] and zoom level (default 14).
 */
export function getSyriaCityOsmReference(
  cityName?: string | null,
  governorateIdOrName?: string | null
): SyrianCityOsmReference {
  const normCity = normalizeLocString(cityName || '');
  const normGov = normalizeLocString(governorateIdOrName || '');

  // 1. Check exact ID match if governorate ID was supplied
  if (governorateIdOrName) {
    const rawGov = governorateIdOrName.trim().toLowerCase();
    const exactIdMatch = SYRIA_14_CITIES_OSM_REFERENCES.find(ref => ref.id === rawGov);
    if (exactIdMatch) {
      // If a specific city within that governorate was given, check if there's a more specific sub-city in aliases
      if (normCity) {
        const cityMatchInSameGov = exactIdMatch.aliases.some(alias => {
          const normAlias = normalizeLocString(alias);
          return normCity.includes(normAlias) || normAlias.includes(normCity);
        });
        if (cityMatchInSameGov) {
          return exactIdMatch;
        }
      } else {
        return exactIdMatch;
      }
    }
  }

  // 2. Search by city name across all 14 OSM references
  if (normCity) {
    for (const ref of SYRIA_14_CITIES_OSM_REFERENCES) {
      const match = ref.aliases.some(alias => {
        const normAlias = normalizeLocString(alias);
        return normCity === normAlias || 
               normCity.includes(normAlias) || 
               normAlias.includes(normCity);
      });
      if (match) {
        return ref;
      }
    }
  }

  // 3. Search by governorate text across all 14 OSM references
  if (normGov) {
    for (const ref of SYRIA_14_CITIES_OSM_REFERENCES) {
      const match = ref.aliases.some(alias => {
        const normAlias = normalizeLocString(alias);
        return normGov === normAlias || 
               normGov.includes(normAlias) || 
               normAlias.includes(normGov);
      });
      if (match) {
        return ref;
      }
    }
  }

  // 4. Default fallback to Damascus if nothing was matched
  return SYRIA_14_CITIES_OSM_REFERENCES.find(r => r.id === 'damascus') || SYRIA_14_CITIES_OSM_REFERENCES[0];
}
