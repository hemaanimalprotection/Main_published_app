export interface SyrianLocationItem {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateId: string;
  governorateNameAr: string;
  cityNameAr: string;
  neighborhoodNameAr?: string;
  lat: number;
  lng: number;
  zoom?: number;
  type: 'city' | 'neighborhood' | 'district' | 'landmark' | 'street';
}

export const POPULAR_SYRIAN_LOCATIONS: SyrianLocationItem[] = [
  // --- DAMASCUS (دمشق) ---
  { id: 'dam-mazzeh', nameAr: 'المزة (فيلات / أوتوستراد)', nameEn: 'Al-Mazzeh', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'المزة', lat: 33.5042, lng: 36.2570, zoom: 15, type: 'neighborhood' },
  { id: 'dam-midan', nameAr: 'الميدان (الجزماتية / الحقلة)', nameEn: 'Al-Midan', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'الميدان', lat: 33.4930, lng: 36.2970, zoom: 15, type: 'neighborhood' },
  { id: 'dam-shaalan', nameAr: 'الشعلان / ساحة النجمة', nameEn: 'Al-Shaalan', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'الشعلان', lat: 33.5180, lng: 36.2890, zoom: 16, type: 'neighborhood' },
  { id: 'dam-malki', nameAr: 'المالكي / حديقة تشرين', nameEn: 'Al-Malki', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'المالكي', lat: 33.5220, lng: 36.2780, zoom: 15, type: 'neighborhood' },
  { id: 'dam-aburummaneh', nameAr: 'أبو رمانة / ساحة المدفع', nameEn: 'Abu Rummaneh', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'أبو رمانة', lat: 33.5200, lng: 36.2830, zoom: 16, type: 'neighborhood' },
  { id: 'dam-kafrsouseh', nameAr: 'كفرسوسة / الشام سيتي سنتر', nameEn: 'Kafr Sousa', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'كفرسوسة', lat: 33.4980, lng: 36.2750, zoom: 15, type: 'neighborhood' },
  { id: 'dam-babtouma', nameAr: 'باب توما / القشلة', nameEn: 'Bab Touma', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'باب توما', lat: 33.5140, lng: 36.3150, zoom: 16, type: 'neighborhood' },
  { id: 'dam-qassa', nameAr: 'القصاع / برج الروس', nameEn: 'Al-Qassaa', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'القصاع', lat: 33.5210, lng: 36.3200, zoom: 16, type: 'neighborhood' },
  { id: 'dam-dummar', nameAr: 'مشروع دمر / وادي المشاريع', nameEn: 'Mashrou Dummar', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'مشروع دمر', lat: 33.5410, lng: 36.2360, zoom: 14, type: 'neighborhood' },
  { id: 'dam-barzeh', nameAr: 'مساكن برزة / برزة البلد', nameEn: 'Barzeh', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'برزة', lat: 33.5550, lng: 36.3150, zoom: 15, type: 'neighborhood' },
  { id: 'dam-ruknaldin', nameAr: 'ركن الدين / ساحة شمدين', nameEn: 'Rukn Al-Din', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'ركن الدين', lat: 33.5350, lng: 36.2950, zoom: 15, type: 'neighborhood' },
  { id: 'dam-muhajirin', nameAr: 'المهاجرين / الجسر الأبيض', nameEn: 'Al-Muhajirin', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'المهاجرين', lat: 33.5270, lng: 36.2750, zoom: 15, type: 'neighborhood' },
  { id: 'dam-sarouja', nameAr: 'ساروجة / شارع الثورة', nameEn: 'Sarouja', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'ساروجة', lat: 33.5160, lng: 36.2980, zoom: 16, type: 'neighborhood' },
  { id: 'dam-baghdadst', nameAr: 'شارع بغداد / العقيبة', nameEn: 'Baghdad Street', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'شارع بغداد', lat: 33.5200, lng: 36.3050, zoom: 16, type: 'street' },
  { id: 'dam-zahira', nameAr: 'الزاهرة (القديمة / الجديدة)', nameEn: 'Al-Zahira', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'الزاهرة', lat: 33.4880, lng: 36.3080, zoom: 15, type: 'neighborhood' },
  { id: 'dam-marjeh', nameAr: 'ساحة المرجة / شارع النصر', nameEn: 'Marjeh Square', governorateId: 'damascus', governorateNameAr: 'دمشق', cityNameAr: 'دمشق', neighborhoodNameAr: 'المرجة', lat: 33.5130, lng: 36.2970, zoom: 16, type: 'landmark' },

  // --- RIF DIMASHQ (ريف دمشق) ---
  { id: 'rif-jaramana', nameAr: 'جرمانا (النهضة / الروضة / كشكول)', nameEn: 'Jaramana', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'جرمانا', neighborhoodNameAr: 'وسط جرمانا', lat: 33.4839, lng: 36.3528, zoom: 14, type: 'city' },
  { id: 'rif-sahnaya', nameAr: 'صحنايا / الكورنيش', nameEn: 'Sahnaya', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'صحنايا', neighborhoodNameAr: 'صحنايا', lat: 33.4344, lng: 36.2394, zoom: 14, type: 'city' },
  { id: 'rif-ashrafiyet', nameAr: 'أشرفية صحنايا', nameEn: 'Ashrafiyat Sahnaya', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'أشرفية صحنايا', neighborhoodNameAr: 'أشرفية صحنايا', lat: 33.4210, lng: 36.2250, zoom: 14, type: 'city' },
  { id: 'rif-qudsaya', nameAr: 'قدسيا / ضاحية قدسيا', nameEn: 'Qudsaya', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'قدسيا', neighborhoodNameAr: 'ضاحية قدسيا', lat: 33.5480, lng: 36.2150, zoom: 14, type: 'city' },
  { id: 'rif-jadidat', nameAr: 'جديدة عرطوز / الفضل', nameEn: 'Jdeidat Artouz', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'جديدة عرطوز', neighborhoodNameAr: 'جديدة عرطوز', lat: 33.4500, lng: 36.1800, zoom: 14, type: 'city' },
  { id: 'rif-mouadamiya', nameAr: 'معضمية الشام', nameEn: 'Moadamiyat Al-Sham', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'معضمية الشام', neighborhoodNameAr: 'معضمية الشام', lat: 33.4650, lng: 36.2100, zoom: 14, type: 'city' },
  { id: 'rif-douma', nameAr: 'دوما', nameEn: 'Douma', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'دوما', neighborhoodNameAr: 'دوما', lat: 33.5714, lng: 36.4028, zoom: 14, type: 'city' },
  { id: 'rif-altall', nameAr: 'التل / حرنة', nameEn: 'Al-Tall', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'التل', neighborhoodNameAr: 'التل', lat: 33.6050, lng: 36.3100, zoom: 14, type: 'city' },
  { id: 'rif-zabadani', nameAr: 'الزبداني / بلودان', nameEn: 'Zabadani', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'الزبداني', neighborhoodNameAr: 'الزبداني', lat: 33.7250, lng: 36.0980, zoom: 13, type: 'city' },
  { id: 'rif-sayyida', nameAr: 'السيدة زينب / حجيرة', nameEn: 'Sayyida Zeinab', governorateId: 'rif_dimashq', governorateNameAr: 'ريف دمشق', cityNameAr: 'السيدة زينب', neighborhoodNameAr: 'السيدة زينب', lat: 33.4440, lng: 36.3400, zoom: 14, type: 'city' },

  // --- ALEPPO (حلب) ---
  { id: 'alp-furqan', nameAr: 'الفرقان / جامعة حلب', nameEn: 'Al-Furqan', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'الفرقان', lat: 36.2080, lng: 37.1180, zoom: 15, type: 'neighborhood' },
  { id: 'alp-shahbaa', nameAr: 'الشهباء (القديمة / الجديدة)', nameEn: 'Al-Shahbaa', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'الشهباء', lat: 36.2220, lng: 37.1250, zoom: 15, type: 'neighborhood' },
  { id: 'alp-siryan', nameAr: 'السريان (القديمة / الجديدة)', nameEn: 'Al-Siryan', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'السريان', lat: 36.2190, lng: 37.1390, zoom: 15, type: 'neighborhood' },
  { id: 'alp-jumailiyeh', nameAr: 'الجميلية / ساحة سعد الله الجابري', nameEn: 'Al-Jumailiyah', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'الجميلية', lat: 36.2060, lng: 37.1460, zoom: 16, type: 'neighborhood' },
  { id: 'alp-aziziyeh', nameAr: 'العزيزية / التلل', nameEn: 'Al-Aziziyah', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'العزيزية', lat: 36.2130, lng: 37.1510, zoom: 16, type: 'neighborhood' },
  { id: 'alp-mokambo', nameAr: 'الموكامبو / حديقة المحبة', nameEn: 'Mokambo', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'الموكامبو', lat: 36.2170, lng: 37.1290, zoom: 15, type: 'neighborhood' },
  { id: 'alp-saifaldawla', nameAr: 'سيف الدولة / الإذاعة', nameEn: 'Saif Al-Dawla', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'سيف الدولة', lat: 36.1950, lng: 37.1250, zoom: 15, type: 'neighborhood' },
  { id: 'alp-nile-street', nameAr: 'شارع النيل / الميدان حلب', nameEn: 'Nile Street', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'شارع النيل', lat: 36.2290, lng: 37.1280, zoom: 15, type: 'street' },
  { id: 'alp-new-aleppo', nameAr: 'حلب الجديدة (شمالي / جنوبي)', nameEn: 'New Aleppo', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'حلب', neighborhoodNameAr: 'حلب الجديدة', lat: 36.2050, lng: 37.0950, zoom: 14, type: 'neighborhood' },
  { id: 'alp-afrin', nameAr: 'عفرين', nameEn: 'Afrin', governorateId: 'aleppo', governorateNameAr: 'حلب', cityNameAr: 'عفرين', neighborhoodNameAr: 'عفرين', lat: 36.5120, lng: 36.8680, zoom: 13, type: 'city' },

  // --- HOMS (حمص) ---
  { id: 'hms-inshaat', nameAr: 'الإنشاءات / دوار السيد الرئيس', nameEn: 'Al-Inshaat', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'الإنشاءات', lat: 34.7220, lng: 36.6950, zoom: 15, type: 'neighborhood' },
  { id: 'hms-waer', nameAr: 'الوعر (الجديد / القديم)', nameEn: 'Al-Waer', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'الوعر', lat: 34.7500, lng: 36.6750, zoom: 14, type: 'neighborhood' },
  { id: 'hms-akrama', nameAr: 'عكرمة (الجديدة / القديمة)', nameEn: 'Akrama', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'عكرمة', lat: 34.7080, lng: 36.7150, zoom: 15, type: 'neighborhood' },
  { id: 'hms-hamra', nameAr: 'الحمراء / طريق الشام', nameEn: 'Al-Hamra', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'الحمراء', lat: 34.7180, lng: 36.7080, zoom: 15, type: 'neighborhood' },
  { id: 'hms-dablan', nameAr: 'الدبلان / ساحة الشهداء', nameEn: 'Al-Dablan', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'الدبلان', lat: 34.7300, lng: 36.7120, zoom: 16, type: 'neighborhood' },
  { id: 'hms-ghouta', nameAr: 'الغوطة / المحطة', nameEn: 'Al-Ghouta', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'حمص', neighborhoodNameAr: 'الغوطة', lat: 34.7380, lng: 36.7050, zoom: 15, type: 'neighborhood' },
  { id: 'hms-qusayr', nameAr: 'القصير', nameEn: 'Al-Qusayr', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'القصير', neighborhoodNameAr: 'القصير', lat: 34.5090, lng: 36.5790, zoom: 13, type: 'city' },
  { id: 'hms-palmyra', nameAr: 'تدمر', nameEn: 'Palmyra', governorateId: 'homs', governorateNameAr: 'حمص', cityNameAr: 'تدمر', neighborhoodNameAr: 'تدمر', lat: 34.5580, lng: 38.2830, zoom: 13, type: 'city' },

  // --- LATAKIA (اللاذقية) ---
  { id: 'lat-ziraa', nameAr: 'مشروع الزراعة / دوار الزراعة', nameEn: 'Mashrou Al-Ziraa', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'اللاذقية', neighborhoodNameAr: 'مشروع الزراعة', lat: 35.5390, lng: 35.7990, zoom: 15, type: 'neighborhood' },
  { id: 'lat-saliba', nameAr: 'الصليبة / الشيخ ضاهر', nameEn: 'Al-Saliba', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'اللاذقية', neighborhoodNameAr: 'الصليبة', lat: 35.5200, lng: 35.7820, zoom: 15, type: 'neighborhood' },
  { id: 'lat-cotedazur', nameAr: 'الشاطئ الأزرق / الميريديان', nameEn: 'Blue Beach (Côte Bleue)', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'اللاذقية', neighborhoodNameAr: 'الشاطئ الأزرق', lat: 35.5820, lng: 35.7480, zoom: 14, type: 'neighborhood' },
  { id: 'lat-corniche', nameAr: 'الكورنيش الجنوبي / الغربي', nameEn: 'Corniche', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'اللاذقية', neighborhoodNameAr: 'الكورنيش', lat: 35.5150, lng: 35.7720, zoom: 15, type: 'street' },
  { id: 'lat-raml', nameAr: 'الرمل الشمالي / مشروع دعدوش', nameEn: 'Al-Raml Al-Shamali', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'اللاذقية', neighborhoodNameAr: 'الرمل الشمالي', lat: 35.5330, lng: 35.7780, zoom: 15, type: 'neighborhood' },
  { id: 'lat-jableh', nameAr: 'مدينة جبلة / الكورنيش', nameEn: 'Jableh', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'جبلة', neighborhoodNameAr: 'جبلة', lat: 35.3600, lng: 35.9280, zoom: 13, type: 'city' },
  { id: 'lat-kessab', nameAr: 'كسب / النبعين', nameEn: 'Kessab', governorateId: 'latakia', governorateNameAr: 'اللاذقية', cityNameAr: 'كسب', neighborhoodNameAr: 'كسب', lat: 35.9270, lng: 35.9890, zoom: 13, type: 'city' },

  // --- TARTOUS (طرطوس) ---
  { id: 'tar-corniche', nameAr: 'الكورنيش البحري / المرفأ', nameEn: 'Tartous Sea Corniche', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'طرطوس', neighborhoodNameAr: 'الكورنيش', lat: 34.8870, lng: 35.8750, zoom: 15, type: 'neighborhood' },
  { id: 'tar-mushabaka', nameAr: 'المشبكة / حي الثورة', nameEn: 'Al-Mushabaka', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'طرطوس', neighborhoodNameAr: 'المشبكة', lat: 34.8950, lng: 35.8880, zoom: 15, type: 'neighborhood' },
  { id: 'tar-ghamqa', nameAr: 'الغمقة (الشرقية / الغربية)', nameEn: 'Al-Ghamqa', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'طرطوس', neighborhoodNameAr: 'الغمقة', lat: 34.8760, lng: 35.8920, zoom: 15, type: 'neighborhood' },
  { id: 'tar-baniyas', nameAr: 'بانياس / المصفاة', nameEn: 'Baniyas', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'بانياس', neighborhoodNameAr: 'بانياس', lat: 35.1810, lng: 35.9400, zoom: 13, type: 'city' },
  { id: 'tar-safita', nameAr: 'صافيتا / برج صافيتا', nameEn: 'Safita', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'صافيتا', neighborhoodNameAr: 'صافيتا', lat: 34.8210, lng: 36.1190, zoom: 13, type: 'city' },
  { id: 'tar-dreikish', nameAr: 'دريكيش / عين الفوار', nameEn: 'Dreikish', governorateId: 'tartus', governorateNameAr: 'طرطوس', cityNameAr: 'دريكيش', neighborhoodNameAr: 'دريكيش', lat: 34.8960, lng: 36.1360, zoom: 13, type: 'city' },

  // --- HAMA (حماة) ---
  { id: 'hma-hadir', nameAr: 'الحاضر / ساحة العاصي / النواعير', nameEn: 'Al-Hadir', governorateId: 'hama', governorateNameAr: 'حماة', cityNameAr: 'حماة', neighborhoodNameAr: 'الحاضر', lat: 35.1370, lng: 36.7560, zoom: 15, type: 'neighborhood' },
  { id: 'hma-dabbagha', nameAr: 'الدباغة / ساحة العبيسي', nameEn: 'Al-Dabbagha', governorateId: 'hama', governorateNameAr: 'حماة', cityNameAr: 'حماة', neighborhoodNameAr: 'الدباغة', lat: 35.1320, lng: 36.7480, zoom: 15, type: 'neighborhood' },
  { id: 'hma-qusoor', nameAr: 'القصور / الأندلس', nameEn: 'Al-Qusoor', governorateId: 'hama', governorateNameAr: 'حماة', cityNameAr: 'حماة', neighborhoodNameAr: 'القصور', lat: 35.1480, lng: 36.7420, zoom: 15, type: 'neighborhood' },
  { id: 'hma-salamiyah', nameAr: 'السلمية', nameEn: 'Salamiyah', governorateId: 'hama', governorateNameAr: 'حماة', cityNameAr: 'السلمية', neighborhoodNameAr: 'السلمية', lat: 35.0110, lng: 37.0530, zoom: 13, type: 'city' },
  { id: 'hma-masyaf', nameAr: 'مصياف / القلعة', nameEn: 'Masyaf', governorateId: 'hama', governorateNameAr: 'حماة', cityNameAr: 'مصياف', neighborhoodNameAr: 'مصياف', lat: 35.0650, lng: 36.3420, zoom: 13, type: 'city' },

  // --- SUWAYDA (السويداء) ---
  { id: 'swd-centre', nameAr: 'السويداء المدينة / ساحة السير', nameEn: 'Soueida Centre', governorateId: 'as_suwayda', governorateNameAr: 'السويداء', cityNameAr: 'السويداء', neighborhoodNameAr: 'السويداء المدينة', lat: 32.7090, lng: 36.5695, zoom: 14, type: 'city' },
  { id: 'swd-shahba', nameAr: 'شهبا / المسرح الروماني', nameEn: 'Shahba', governorateId: 'as_suwayda', governorateNameAr: 'السويداء', cityNameAr: 'شهبا', neighborhoodNameAr: 'شهبا', lat: 32.8550, lng: 36.6260, zoom: 13, type: 'city' },
  { id: 'swd-salkhad', nameAr: 'صلخد / القلعة', nameEn: 'Salkhad', governorateId: 'as_suwayda', governorateNameAr: 'السويداء', cityNameAr: 'صلخد', neighborhoodNameAr: 'صلخد', lat: 32.4930, lng: 36.7110, zoom: 13, type: 'city' },

  // --- DARAA (درعا) ---
  { id: 'dar-mahatta', nameAr: 'درعا المحطة / حي السبيل', nameEn: 'Daraa Al-Mahatta', governorateId: 'daraa', governorateNameAr: 'درعا', cityNameAr: 'درعا', neighborhoodNameAr: 'درعا المحطة', lat: 32.6320, lng: 36.1080, zoom: 14, type: 'city' },
  { id: 'dar-balad', nameAr: 'درعا البلد / المنشية', nameEn: 'Daraa Al-Balad', governorateId: 'daraa', governorateNameAr: 'درعا', cityNameAr: 'درعا', neighborhoodNameAr: 'درعا البلد', lat: 32.6130, lng: 36.1020, zoom: 14, type: 'neighborhood' },
  { id: 'dar-bosra', nameAr: 'بصرى الشام / المدرج الأثري', nameEn: 'Bosra Al-Sham', governorateId: 'daraa', governorateNameAr: 'درعا', cityNameAr: 'بصرى الشام', neighborhoodNameAr: 'بصرى الشام', lat: 32.5180, lng: 36.4810, zoom: 14, type: 'city' },
  { id: 'dar-izra', nameAr: 'إزرع / الصنمين', nameEn: 'Izra', governorateId: 'daraa', governorateNameAr: 'درعا', cityNameAr: 'إزرع', neighborhoodNameAr: 'إزرع', lat: 32.8710, lng: 36.2520, zoom: 13, type: 'city' },

  // --- HASAKAH & QAMISHLI (الحسكة والقامشلي) ---
  { id: 'has-qamishli-wousta', nameAr: 'القامشلي (الوسطى / السياحي)', nameEn: 'Qamishli Centre', governorateId: 'al_hasakah', governorateNameAr: 'الحسكة', cityNameAr: 'القامشلي', neighborhoodNameAr: 'الوسطى', lat: 37.0500, lng: 41.2250, zoom: 14, type: 'city' },
  { id: 'has-qamishli-corniche', nameAr: 'القامشلي (الكورنيش / الغربية)', nameEn: 'Qamishli Corniche', governorateId: 'al_hasakah', governorateNameAr: 'الحسكة', cityNameAr: 'القامشلي', neighborhoodNameAr: 'الكورنيش', lat: 37.0420, lng: 41.2100, zoom: 14, type: 'neighborhood' },
  { id: 'has-centre', nameAr: 'الحسكة المدينة (المساكن / غويران)', nameEn: 'Hassakeh Centre', governorateId: 'al_hasakah', governorateNameAr: 'الحسكة', cityNameAr: 'الحسكة', neighborhoodNameAr: 'الحسكة المدينة', lat: 36.5050, lng: 40.7450, zoom: 14, type: 'city' },
  { id: 'has-malikiyah', nameAr: 'المالكية (ديريك)', nameEn: 'Al-Malikiyah', governorateId: 'al_hasakah', governorateNameAr: 'الحسكة', cityNameAr: 'المالكية', neighborhoodNameAr: 'المالكية', lat: 37.1780, lng: 42.1380, zoom: 13, type: 'city' },

  // --- DEIR EZ-ZOR (دير الزور) ---
  { id: 'dez-centre', nameAr: 'دير الزور المدينة (الرشدية / الجورة / القصور)', nameEn: 'Deir ez-Zor City', governorateId: 'deir_ez_zor', governorateNameAr: 'دير الزور', cityNameAr: 'دير الزور', neighborhoodNameAr: 'القصور', lat: 35.3359, lng: 40.1408, zoom: 14, type: 'city' },
  { id: 'dez-mayadin', nameAr: 'الميادين / البوكمال', nameEn: 'Al-Mayadin', governorateId: 'deir_ez_zor', governorateNameAr: 'دير الزور', cityNameAr: 'الميادين', neighborhoodNameAr: 'الميادين', lat: 34.9200, lng: 40.4500, zoom: 13, type: 'city' },

  // --- RAQQA (الرقة) ---
  { id: 'raq-centre', nameAr: 'الرقة المدينة (الثكنة / الفردوس)', nameEn: 'Raqqa City', governorateId: 'raqqa', governorateNameAr: 'الرقة', cityNameAr: 'الرقة', neighborhoodNameAr: 'الرقة المدينة', lat: 35.9594, lng: 39.0089, zoom: 14, type: 'city' },
  { id: 'raq-tabqa', nameAr: 'الطبقة (مدينة الثورة)', nameEn: 'Al-Tabqa', governorateId: 'raqqa', governorateNameAr: 'الرقة', cityNameAr: 'الطبقة', neighborhoodNameAr: 'الطبقة', lat: 35.8360, lng: 38.5440, zoom: 13, type: 'city' },

  // --- IDLIB (إدلب) ---
  { id: 'idb-centre', nameAr: 'إدلب المدينة (الضبيط / الجامعة)', nameEn: 'Idlib City', governorateId: 'idlib', governorateNameAr: 'إدلب', cityNameAr: 'إدلب', neighborhoodNameAr: 'إدلب المدينة', lat: 35.9306, lng: 36.6339, zoom: 14, type: 'city' },
  { id: 'idb-sarmada', nameAr: 'سرمدا / الدانا', nameEn: 'Sarmada', governorateId: 'idlib', governorateNameAr: 'إدلب', cityNameAr: 'سرمدا', neighborhoodNameAr: 'سرمدا', lat: 36.1820, lng: 36.7210, zoom: 13, type: 'city' },
  { id: 'idb-ariha', nameAr: 'أريحا / معرة النعمان', nameEn: 'Ariha', governorateId: 'idlib', governorateNameAr: 'إدلب', cityNameAr: 'أريحا', neighborhoodNameAr: 'أريحا', lat: 35.8120, lng: 36.6110, zoom: 13, type: 'city' },

  // --- QUNEITRA (القنيطرة) ---
  { id: 'qun-baath', nameAr: 'مدينة البعث / خان أرنبة', nameEn: 'Madinat Al-Baath', governorateId: 'quneitra', governorateNameAr: 'القنيطرة', cityNameAr: 'مدينة البعث', neighborhoodNameAr: 'مدينة البعث', lat: 33.1259, lng: 35.8242, zoom: 13, type: 'city' }
];

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestSyrianLocation(lat: number, lng: number): SyrianLocationItem | null {
  let closest: SyrianLocationItem | null = null;
  let minDistance = Infinity;

  for (const loc of POPULAR_SYRIAN_LOCATIONS) {
    const dist = getDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return closest;
}

export interface GeocodedAddressResult {
  governorateId?: string;
  governorateNameAr?: string;
  city?: string;
  neighborhood?: string;
  road?: string;
  areaName?: string;
  exactAddress?: string;
  fullAddress?: string;
}

export async function reverseGeocodeSyria(lat: number, lng: number): Promise<GeocodedAddressResult> {
  const nearest = findNearestSyrianLocation(lat, lng);
  const dist = nearest ? getDistanceKm(lat, lng, nearest.lat, nearest.lng) : 999;

  let baseResult: GeocodedAddressResult = nearest ? {
    governorateId: nearest.governorateId !== 'custom' ? nearest.governorateId : undefined,
    governorateNameAr: nearest.governorateNameAr,
    city: nearest.cityNameAr,
    neighborhood: nearest.neighborhoodNameAr || nearest.nameAr,
    areaName: nearest.nameAr,
    exactAddress: `${nearest.cityNameAr} - ${nearest.neighborhoodNameAr || nearest.nameAr} (${nearest.governorateNameAr})`,
    fullAddress: `${nearest.cityNameAr} - ${nearest.neighborhoodNameAr || nearest.nameAr}`
  } : {
    city: 'دمشق',
    neighborhood: 'موقع محدد على الخريطة',
    exactAddress: `إحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
  };

  // Attempt Nominatim reverse geocode for street-level precision
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,en`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.district || '';
        const cityName = addr.city || addr.town || addr.village || addr.municipality || baseResult.city || 'دمشق';
        const state = addr.state || addr.province || addr.county || baseResult.governorateNameAr || '';

        const matchedGov = POPULAR_SYRIAN_LOCATIONS.find(l => 
          (state && l.governorateNameAr && state.includes(l.governorateNameAr)) ||
          (cityName && l.cityNameAr && cityName.includes(l.cityNameAr))
        )?.governorateId || baseResult.governorateId;

        const neighborhoodResolved = suburb || road || baseResult.neighborhood || 'حي على الخريطة';
        const addressPieces = [
          cityName,
          suburb,
          road
        ].filter(Boolean);

        const exactFormatted = addressPieces.length > 0
          ? addressPieces.join('، ')
          : (data.display_name?.split(',').slice(0, 3).map((s: string) => s.trim()).join('، ') || baseResult.exactAddress);

        return {
          governorateId: matchedGov,
          governorateNameAr: state || baseResult.governorateNameAr,
          city: cityName,
          neighborhood: neighborhoodResolved,
          road,
          areaName: suburb || road || nearest?.nameAr || cityName,
          exactAddress: exactFormatted,
          fullAddress: exactFormatted
        };
      }
    }
  } catch {
    // If network fails or times out, fallback immediately to nearest Syrian landmark database
  }

  return baseResult;
}

export async function searchNominatimSyria(query: string): Promise<SyrianLocationItem[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = encodeURIComponent(`${query.trim()}, Syria`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${cleanQuery}&countrycodes=sy&accept-language=ar,en&limit=5`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any, idx: number) => ({
      id: `osm-${item.place_id || idx}`,
      nameAr: item.display_name?.split(',')[0] || query,
      nameEn: item.name || query,
      governorateId: 'custom',
      governorateNameAr: 'سورية',
      cityNameAr: item.display_name?.split(',')[1]?.trim() || '',
      neighborhoodNameAr: item.display_name?.split(',')[0]?.trim() || query,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      zoom: 16,
      type: 'landmark'
    }));
  } catch {
    return [];
  }
}
