export interface CountryInfo {
  code: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  dialCode: string;
  flag: string;
  formatPlaceholder: string;
}

export const COUNTRIES: CountryInfo[] = [
  // Middle East & Levant
  { code: 'SY', nameAr: 'سورية', nameEn: 'Syria', nameFr: 'Syrie', dialCode: '+963', flag: '🇸🇾', formatPlaceholder: '0955 123 456' },
  { code: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', nameFr: 'Liban', dialCode: '+961', flag: '🇱🇧', formatPlaceholder: '70 123 456' },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', nameFr: 'Jordanie', dialCode: '+962', flag: '🇯🇴', formatPlaceholder: '79 123 4567' },
  { code: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', nameFr: 'Palestine', dialCode: '+970', flag: '🇵🇸', formatPlaceholder: '599 123 456' },
  { code: 'IQ', nameAr: 'العراق', nameEn: 'Iraq', nameFr: 'Irak', dialCode: '+964', flag: '🇮🇶', formatPlaceholder: '770 123 4567' },
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt', nameFr: 'Égypte', dialCode: '+20', flag: '🇪🇬', formatPlaceholder: '10 1234 5678' },
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', nameFr: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦', formatPlaceholder: '50 123 4567' },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates', nameFr: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪', formatPlaceholder: '50 123 4567' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', nameFr: 'Koweït', dialCode: '+965', flag: '🇰🇼', formatPlaceholder: '9123 4567' },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar', nameFr: 'Qatar', dialCode: '+974', flag: '🇶🇦', formatPlaceholder: '3312 3456' },
  { code: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', nameFr: 'Bahreïn', dialCode: '+973', flag: '🇧🇭', formatPlaceholder: '3912 3456' },
  { code: 'OM', nameAr: 'عُمان', nameEn: 'Oman', nameFr: 'Oman', dialCode: '+968', flag: '🇴🇲', formatPlaceholder: '9123 4567' },
  { code: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', nameFr: 'Yémen', dialCode: '+967', flag: '🇾🇪', formatPlaceholder: '77 123 4567' },
  
  // North Africa & Mediterranean
  { code: 'TR', nameAr: 'تركيا', nameEn: 'Turkey', nameFr: 'Turquie', dialCode: '+90', flag: '🇹🇷', formatPlaceholder: '532 123 4567' },
  { code: 'TN', nameAr: 'تونس', nameEn: 'Tunisia', nameFr: 'Tunisie', dialCode: '+216', flag: '🇹🇳', formatPlaceholder: '20 123 456' },
  { code: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria', nameFr: 'Algérie', dialCode: '+213', flag: '🇩🇿', formatPlaceholder: '550 123 456' },
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', nameFr: 'Maroc', dialCode: '+212', flag: '🇲🇦', formatPlaceholder: '612 345 678' },
  { code: 'LY', nameAr: 'ليبيا', nameEn: 'Libya', nameFr: 'Libye', dialCode: '+218', flag: '🇱🇾', formatPlaceholder: '91 123 4567' },
  { code: 'SD', nameAr: 'السودان', nameEn: 'Sudan', nameFr: 'Soudan', dialCode: '+249', flag: '🇸🇩', formatPlaceholder: '91 234 5678' },

  // Europe
  { code: 'FR', nameAr: 'فرنسا', nameEn: 'France', nameFr: 'France', dialCode: '+33', flag: '🇫🇷', formatPlaceholder: '6 12 34 56 78' },
  { code: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', nameFr: 'Allemagne', dialCode: '+49', flag: '🇩🇪', formatPlaceholder: '151 12345678' },
  { code: 'SE', nameAr: 'السويد', nameEn: 'Sweden', nameFr: 'Suède', dialCode: '+46', flag: '🇸🇪', formatPlaceholder: '70 123 45 67' },
  { code: 'GB', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom', nameFr: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧', formatPlaceholder: '7911 123456' },
  { code: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands', nameFr: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱', formatPlaceholder: '6 12345678' },
  { code: 'CH', nameAr: 'سويسرا', nameEn: 'Switzerland', nameFr: 'Suisse', dialCode: '+41', flag: '🇨🇭', formatPlaceholder: '79 123 45 67' },
  { code: 'AT', nameAr: 'النمسا', nameEn: 'Austria', nameFr: 'Autriche', dialCode: '+43', flag: '🇦🇹', formatPlaceholder: '664 123456' },
  { code: 'BE', nameAr: 'بلجيكا', nameEn: 'Belgium', nameFr: 'Belgique', dialCode: '+32', flag: '🇧🇪', formatPlaceholder: '470 12 34 56' },
  { code: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain', nameFr: 'Espagne', dialCode: '+34', flag: '🇪🇸', formatPlaceholder: '612 34 56 78' },
  { code: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy', nameFr: 'Italie', dialCode: '+39', flag: '🇮🇹', formatPlaceholder: '320 123 4567' },
  { code: 'GR', nameAr: 'اليونان', nameEn: 'Greece', nameFr: 'Grèce', dialCode: '+30', flag: '🇬🇷', formatPlaceholder: '691 234 5678' },
  { code: 'NO', nameAr: 'النرويج', nameEn: 'Norway', nameFr: 'Norvège', dialCode: '+47', flag: '🇳🇴', formatPlaceholder: '412 34 567' },
  { code: 'DK', nameAr: 'الدنمارك', nameEn: 'Denmark', nameFr: 'Danemark', dialCode: '+45', flag: '🇩🇰', formatPlaceholder: '20 12 34 56' },
  { code: 'FI', nameAr: 'فنلندا', nameEn: 'Finland', nameFr: 'Finlande', dialCode: '+358', flag: '🇫🇮', formatPlaceholder: '40 123 4567' },
  { code: 'IE', nameAr: 'إيرلندا', nameEn: 'Ireland', nameFr: 'Irlande', dialCode: '+353', flag: '🇮🇪', formatPlaceholder: '85 123 4567' },
  { code: 'PL', nameAr: 'بولندا', nameEn: 'Poland', nameFr: 'Pologne', dialCode: '+48', flag: '🇵🇱', formatPlaceholder: '512 345 678' },
  { code: 'RO', nameAr: 'رومانيا', nameEn: 'Romania', nameFr: 'Roumanie', dialCode: '+40', flag: '🇷🇴', formatPlaceholder: '712 345 678' },
  { code: 'RU', nameAr: 'روسيا', nameEn: 'Russia', nameFr: 'Russie', dialCode: '+7', flag: '🇷🇺', formatPlaceholder: '912 345-67-89' },
  { code: 'CY', nameAr: 'قبرص', nameEn: 'Cyprus', nameFr: 'Chypre', dialCode: '+357', flag: '🇨🇾', formatPlaceholder: '96 123456' },

  // Americas
  { code: 'US', nameAr: 'الولايات المتحدة', nameEn: 'United States', nameFr: 'États-Unis', dialCode: '+1', flag: '🇺🇸', formatPlaceholder: '202 555 0123' },
  { code: 'CA', nameAr: 'كندا', nameEn: 'Canada', nameFr: 'Canada', dialCode: '+1', flag: '🇨🇦', formatPlaceholder: '416 555 0123' },
  { code: 'BR', nameAr: 'البرازيل', nameEn: 'Brazil', nameFr: 'Brésil', dialCode: '+55', flag: '🇧🇷', formatPlaceholder: '11 91234-5678' },
  { code: 'MX', nameAr: 'المكسيك', nameEn: 'Mexico', nameFr: 'Mexique', dialCode: '+52', flag: '🇲🇽', formatPlaceholder: '55 1234 5678' },
  { code: 'AR', nameAr: 'الأرجنتين', nameEn: 'Argentina', nameFr: 'Argentine', dialCode: '+54', flag: '🇦🇷', formatPlaceholder: '9 11 1234-5678' },

  // Asia & Oceania
  { code: 'AU', nameAr: 'أستراليا', nameEn: 'Australia', nameFr: 'Australie', dialCode: '+61', flag: '🇦🇺', formatPlaceholder: '412 345 678' },
  { code: 'NZ', nameAr: 'نيوزيلندا', nameEn: 'New Zealand', nameFr: 'Nouvelle-Zélande', dialCode: '+64', flag: '🇳🇿', formatPlaceholder: '21 123 4567' },
  { code: 'CN', nameAr: 'الصين', nameEn: 'China', nameFr: 'Chine', dialCode: '+86', flag: '🇨🇳', formatPlaceholder: '138 0013 8000' },
  { code: 'JP', nameAr: 'اليابان', nameEn: 'Japan', nameFr: 'Japon', dialCode: '+81', flag: '🇯🇵', formatPlaceholder: '90 1234 5678' },
  { code: 'IN', nameAr: 'الهند', nameEn: 'India', nameFr: 'Inde', dialCode: '+91', flag: '🇮🇳', formatPlaceholder: '98765 43210' },
  { code: 'MY', nameAr: 'ماليزيا', nameEn: 'Malaysia', nameFr: 'Malaisie', dialCode: '+60', flag: '🇲🇾', formatPlaceholder: '12-345 6789' }
];

export const isEmailAddress = (value: string): boolean => {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const isPhoneNumber = (value: string): boolean => {
  const cleaned = value.trim().replace(/[\s\-\(\)\.]/g, '');
  return /^(\+?[0-9]{7,16})$/.test(cleaned);
};

/**
 * Normalizes phone numbers to standard E.164 format.
 * Examples:
 *  "0955123456" with Syria (+963) -> "+963955123456"
 *  "0612345678" with France (+33) -> "+33612345678"
 *  "+33612345678" -> "+33612345678"
 *  "0033612345678" -> "+33612345678"
 */
export const normalizePhoneNumber = (rawNumber: string, defaultCountryDial = '+963'): string => {
  let cleaned = rawNumber.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }

  // Remove leading 0 from national subscriber numbers when prepending dialCode
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return `${defaultCountryDial}${cleaned}`;
};
