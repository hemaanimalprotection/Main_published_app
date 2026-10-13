// Syria Governorates & Geographic Reference Data
export interface SyrianGovernorate {
  id: string;
  nameAr: string;
  nameFr: string;
  lat: number;
  lng: number;
  zoom: number;
  majorCities: { nameAr: string; nameFr: string }[];
}

export const SYRIAN_GOVERNORATES: SyrianGovernorate[] = [
  {
    id: 'damascus',
    nameAr: 'دمشق',
    nameFr: 'Damas',
    lat: 33.5138,
    lng: 36.2765,
    zoom: 12,
    majorCities: [
      { nameAr: 'دمشق القديمة', nameFr: 'Vieille Ville de Damas' },
      { nameAr: 'الميدان', nameFr: 'Al-Midan' },
      { nameAr: 'المزة', nameFr: 'Al-Mezzeh' },
      { nameAr: 'الصالحية', nameFr: 'Al-Salihiyah' },
      { nameAr: 'المهاجرين', nameFr: 'Al-Muhajireen' },
      { nameAr: 'القابون', nameFr: 'Al-Qaboun' },
      { nameAr: 'برزة', nameFr: 'Barzeh' },
      { nameAr: 'كفرسوسة', nameFr: 'Kfar Souseh' },
      { nameAr: 'ركن الدين', nameFr: 'Rukn al-Din' }
    ]
  },
  {
    id: 'rif_dimashq',
    nameAr: 'ريف دمشق',
    nameFr: 'Rif Dimachq',
    lat: 33.5850,
    lng: 36.4500,
    zoom: 11,
    majorCities: [
      { nameAr: 'جرمانا', nameFr: 'Jaramana' },
      { nameAr: 'صحنايا', nameFr: 'Sahnaya' },
      { nameAr: 'الدويلعة', nameFr: 'Dweila' },
      { nameAr: 'قدسيا', nameFr: 'Qudsaya' },
      { nameAr: 'دوما', nameFr: 'Douma' },
      { nameAr: 'الزبداني', nameFr: 'Zabadani' },
      { nameAr: 'الكسوة', nameFr: 'Al-Kiswah' },
      { nameAr: 'قطنا', nameFr: 'Qatana' },
      { nameAr: 'يبرود', nameFr: 'Yabroud' },
      { nameAr: 'النبك', nameFr: 'Al-Nabk' }
    ]
  },
  {
    id: 'aleppo',
    nameAr: 'حلب',
    nameFr: 'Alep',
    lat: 36.2021,
    lng: 37.1343,
    zoom: 12,
    majorCities: [
      { nameAr: 'حلب المدينة', nameFr: 'Alep Centre' },
      { nameAr: 'الشهباء', nameFr: 'Al-Shahbaa' },
      { nameAr: 'الفرقان', nameFr: 'Al-Furqan' },
      { nameAr: 'السريان', nameFr: 'Al-Siryan' },
      { nameAr: 'الجميلية', nameFr: 'Al-Jumailiyah' },
      { nameAr: 'عفرين', nameFr: 'Afrin' },
      { nameAr: 'منبج', nameFr: 'Manbij' },
      { nameAr: 'اعزاز', nameFr: 'Azaz' }
    ]
  },
  {
    id: 'homs',
    nameAr: 'حمص',
    nameFr: 'Homs',
    lat: 34.7324,
    lng: 36.7137,
    zoom: 12,
    majorCities: [
      { nameAr: 'حمص المدينة', nameFr: 'Homs Centre' },
      { nameAr: 'الإنشاءات', nameFr: 'Al-Inshaat' },
      { nameAr: 'الحمراء', nameFr: 'Al-Hamra' },
      { nameAr: 'الوعر', nameFr: 'Al-Waer' },
      { nameAr: 'عكرمة', nameFr: 'Akrama' },
      { nameAr: 'تدمر', nameFr: 'Palmyre' },
      { nameAr: 'القصير', nameFr: 'Al-Qusayr' },
      { nameAr: 'الرستن', nameFr: 'Al-Rastan' },
      { nameAr: 'تلكلخ', nameFr: 'Talkalakh' }
    ]
  },
  {
    id: 'latakia',
    nameAr: 'اللاذقية',
    nameFr: 'Lattaquié',
    lat: 35.5317,
    lng: 35.7909,
    zoom: 12,
    majorCities: [
      { nameAr: 'اللاذقية المدينة', nameFr: 'Lattaquié Centre' },
      { nameAr: 'مشروع الزراعة', nameFr: 'Mashrou Al-Ziraa' },
      { nameAr: 'الصليبة', nameFr: 'Al-Saliba' },
      { nameAr: 'الشاطئ الأزرق', nameFr: 'Côte Bleue' },
      { nameAr: 'جبلة', nameFr: 'Jableh' },
      { nameAr: 'القرداحة', nameFr: 'Qardaha' },
      { nameAr: 'كسب', nameFr: 'Kessab' },
      { nameAr: 'الحفة', nameFr: 'Al-Haffah' }
    ]
  },
  {
    id: 'tartus',
    nameAr: 'طرطوس',
    nameFr: 'Tartous',
    lat: 34.8890,
    lng: 35.8866,
    zoom: 12,
    majorCities: [
      { nameAr: 'طرطوس المدينة', nameFr: 'Tartous Centre' },
      { nameAr: 'بانياس', nameFr: 'Baniyas' },
      { nameAr: 'صافيتا', nameFr: 'Safita' },
      { nameAr: 'دريكيش', nameFr: 'Dreikish' },
      { nameAr: 'الشيخ بدر', nameFr: 'Al-Sheikh Badr' }
    ]
  },
  {
    id: 'hama',
    nameAr: 'حماة',
    nameFr: 'Hama',
    lat: 35.1318,
    lng: 36.7578,
    zoom: 12,
    majorCities: [
      { nameAr: 'حماة المدينة', nameFr: 'Hama Centre' },
      { nameAr: 'السلمية', nameFr: 'Salamiyah' },
      { nameAr: 'مصياف', nameFr: 'Masyaf' },
      { nameAr: 'محردة', nameFr: 'Mhardeh' },
      { nameAr: 'السقيلبية', nameFr: 'Suqaylabiyah' }
    ]
  },
  {
    id: 'idlib',
    nameAr: 'إدلب',
    nameFr: 'Idlib',
    lat: 35.9306,
    lng: 36.6339,
    zoom: 11,
    majorCities: [
      { nameAr: 'إدلب المدينة', nameFr: 'Idlib Centre' },
      { nameAr: 'معرة النعمان', nameFr: 'Maarat al-Numan' },
      { nameAr: 'أريحا', nameFr: 'Ariha' },
      { nameAr: 'جسر الشغور', nameFr: 'Jisr al-Shughur' },
      { nameAr: 'سرمدا', nameFr: 'Sarmada' }
    ]
  },
  {
    id: 'daraa',
    nameAr: 'درعا',
    nameFr: 'Daraa',
    lat: 32.6255,
    lng: 36.1051,
    zoom: 11,
    majorCities: [
      { nameAr: 'درعا المدينة', nameFr: 'Daraa Centre' },
      { nameAr: 'إزرع', nameFr: 'Izra' },
      { nameAr: 'الصنمين', nameFr: 'Al-Sanamayn' },
      { nameAr: 'نوى', nameFr: 'Nawa' },
      { nameAr: 'بصرى الشام', nameFr: 'Bosra al-Sham' }
    ]
  },
  {
    id: 'as_suwayda',
    nameAr: 'السويداء',
    nameFr: 'Soueïda',
    lat: 32.7090,
    lng: 36.5695,
    zoom: 11,
    majorCities: [
      { nameAr: 'السويداء المدينة', nameFr: 'Soueïda Centre' },
      { nameAr: 'شهبا', nameFr: 'Shahba' },
      { nameAr: 'صلخد', nameFr: 'Salkhad' },
      { nameAr: 'القريا', nameFr: 'Al-Qurayya' }
    ]
  },
  {
    id: 'quneitra',
    nameAr: 'القنيطرة',
    nameFr: 'Qouneitra',
    lat: 33.1259,
    lng: 35.8242,
    zoom: 11,
    majorCities: [
      { nameAr: 'مدينة البعث', nameFr: 'Madinat al-Baath' },
      { nameAr: 'خان أرنبة', nameFr: 'Khan Arnabah' }
    ]
  },
  {
    id: 'deir_ez_zor',
    nameAr: 'دير الزور',
    nameFr: 'Deir ez-Zor',
    lat: 35.3359,
    lng: 40.1408,
    zoom: 11,
    majorCities: [
      { nameAr: 'دير الزور المدينة', nameFr: 'Deir ez-Zor Centre' },
      { nameAr: 'الميادين', nameFr: 'Al-Mayadin' },
      { nameAr: 'البوكمال', nameFr: 'Al-Bukamal' }
    ]
  },
  {
    id: 'raqqa',
    nameAr: 'الرقة',
    nameFr: 'Raqqa',
    lat: 35.9594,
    lng: 39.0089,
    zoom: 11,
    majorCities: [
      { nameAr: 'الرقة المدينة', nameFr: 'Raqqa Centre' },
      { nameAr: 'الطبقة', nameFr: 'Al-Thawrah (Al-Tabqa)' },
      { nameAr: 'تل أبيض', nameFr: 'Tal Abyad' }
    ]
  },
  {
    id: 'al_hasakah',
    nameAr: 'الحسكة',
    nameFr: 'Hassaké',
    lat: 36.5050,
    lng: 40.7450,
    zoom: 11,
    majorCities: [
      { nameAr: 'الحسكة المدينة', nameFr: 'Hassaké Centre' },
      { nameAr: 'القامشلي', nameFr: 'Qamishli' },
      { nameAr: 'المالكية', nameFr: 'Al-Malikiyah' },
      { nameAr: 'عامودا', nameFr: 'Amuda' },
      { nameAr: 'رأس العين', nameFr: 'Ras al-Ayn' }
    ]
  }
];

// User & Auth Types
export type UserRole = 'citizen' | 'responder' | 'volunteer';
export type ResponderType = 'association' | 'veterinarian';
export type AccountType = 'citizen' | 'association' | 'veterinarian' | 'volunteer';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

// Volunteer Role Capabilities (Multiple Selection Support)
export type VolunteerRole = 'transport' | 'first_aid' | 'temporary_shelter' | 'other';

export interface VolunteerRoleConfig {
  id: VolunteerRole;
  labelAr: string;
  labelFr: string;
  shortLabelAr: string;
  descriptionAr: string;
  badgeBg: string;
  badgeText: string;
}

export const VOLUNTEER_ROLE_DEFINITIONS: Record<VolunteerRole, VolunteerRoleConfig> = {
  transport: {
    id: 'transport',
    labelAr: 'المساعدة في النقل والتوصيل (إسعاف / لوجستي)',
    labelFr: 'Aide au transport et à la logistique',
    shortLabelAr: 'نقل وإسعاف',
    descriptionAr: 'تأمين وسيلة نقل لنقل الحيوانات المصابة أو المنقذة بين موقع البلاغ والعيادات أو الملاجئ.',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-800'
  },
  first_aid: {
    id: 'first_aid',
    labelAr: 'إسعاف أولي بيطري ميداني مدرب',
    labelFr: 'Premiers secours vétérinaires formés',
    shortLabelAr: 'إسعاف أولي',
    descriptionAr: 'تقديم الإسعافات الميدانية الفورية (تضميد، وقف النزيف، السيطرة على الصدمة) ريثما يتم النقل للطبيب.',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800'
  },
  temporary_shelter: {
    id: 'temporary_shelter',
    labelAr: 'تأمين استضافة ورعاية مؤقتة (Foster)',
    labelFr: 'Accueil et hébergement temporaire',
    shortLabelAr: 'إيواء واستضافة مؤقتة',
    descriptionAr: 'استضافة حيوان في مرحلة النقاهة أو حتى توفير عائلة تتبناه في مكان آمن ونظيف.',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800'
  },
  other: {
    id: 'other',
    labelAr: 'تقديم مساعدات ونشاطات ميدانية أخرى',
    labelFr: 'Autre type d\'aide ou soutien terrain',
    shortLabelAr: 'مساعدات أخرى',
    descriptionAr: 'تأمين أطعمة، مستلزمات رعاية، توثيق وتصوير الحالات، أو تنسيق لوجستي محلي في الحي.',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800'
  }
};

export interface VolunteerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  governorate: string;
  city: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  coverageRadiusKm?: number;
  
  // Multiple selected volunteer capabilities
  roles: VolunteerRole[];
  
  // Specific details based on roles
  hasVehicle?: boolean;
  vehicleType?: string; // e.g. "سيارة خاصة", "دراجة نارية", "فان صغير"
  shelterCapacityNote?: string; // e.g. "غرفة مخصصة دافئة، يمكن استضافة قطط أو جراء"
  otherHelpDetails?: string; // Details if other is selected
  
  experienceNote?: string;
  availability: 'available' | 'weekends_only' | 'emergency_on_call' | 'busy';
  verificationStatus: 'active' | 'verified';
  totalAssistsCount: number;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface VolunteerDispatchRequest {
  id: string;
  reportId?: string;
  reportReference?: string;
  senderId: string;
  senderName: string;
  senderType: ResponderType;
  volunteerId: string;
  volunteerName: string;
  roleNeeded: VolunteerRole;
  governorate: string;
  city: string;
  neighborhood?: string;
  address?: string;
  urgencyLevel: 'normal' | 'urgent' | 'critical';
  message: string;
  status: 'sent' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  isAdmin?: boolean;
  volunteerEnabled?: boolean;
  phone: string;
  phoneVerified: boolean;
  fullName: string;
  email?: string;
  governorate: string;
  city: string;
  neighborhood?: string;
  avatarUrl?: string;
  volunteerProfileId?: string;
  languagePreference: 'ar' | 'fr';
  createdAt: string;
  updatedAt: string;
}

export interface ResponderDocument {
  id: string;
  responderId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  fileSizeKb?: number;
  uploadedAt: string;
}

export interface ResponderProfile {
  id: string;
  userId: string;
  responderType: ResponderType;
  verificationStatus: VerificationStatus;
  
  // Organization / Doctor Info
  name: string; // Association Name or Dr. Full Name
  title?: string; // e.g. "طبيبة وجراحة بيطرية"
  specialty?: string;
  description: string;
  responsibleContactPerson?: string; // For associations
  email: string;
  phone: string;
  governoratesServed: string[];
  citiesServed: string[];
  servicesOffered: string[]; // ['rescue', 'veterinary_care', 'shelter', 'foster', 'transport', 'spay_neuter']
  
  // Clinic / Legal
  clinicName?: string;
  clinicAddress?: string;
  registrationNumber?: string; // Syndicate / Ministry registration
  supportingDocumentUrls?: string[];
  logoUrl?: string;
  availability: 'available' | 'busy' | 'emergency_only' | 'unavailable';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents?: ResponderDocument[];
  createdAt: string;
  updatedAt?: string;
}

// Animal Types
export type AnimalType = 
  | 'cat' 
  | 'dog' 
  | 'bird' 
  | 'horse_donkey' 
  | 'farm_animal' 
  | 'wildlife' 
  | 'other';

// Problem Categories
export type ProblemCategory =
  | 'abuse_violence'
  | 'injured'
  | 'sick'
  | 'abandoned'
  | 'homeless'
  | 'trapped'
  | 'road_accident'
  | 'poisoning'
  | 'food_water'
  | 'mother_babies'
  | 'shelter_needed'
  | 'other_emergency';

export type SituationType = 
  | ProblemCategory 
  | 'injury' 
  | 'violence' 
  | 'sickness' 
  | 'abandonment' 
  | 'entrapment' 
  | 'homelessness';

// Severity Levels
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical' | 'urgent' | 'moderate';

// Report Statuses
export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'waiting_responder'
  | 'responsibility_accepted'
  | 'responder_on_way'
  | 'animal_located'
  | 'receiving_veterinary_care'
  | 'sheltered_or_fostered'
  | 'adoption_process'
  | 'resolved'
  | 'closed'
  | 'duplicate'
  | 'invalid';

// Media Item
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  caption?: string;
  createdAt: string;
}

// Animal Emergency Report
export interface AnimalReport {
  id: string;
  referenceNumber: string; // e.g. "HEMA-2026-SY-012"
  reporterId: string;
  reporterName?: string;
  
  // Animal details
  animalType: AnimalType;
  animalCount: number;
  problemCategory: ProblemCategory;
  severity: SeverityLevel;
  description: string;
  
  // Location
  governorate: string;
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
  approxLat: number; // Privacy-reduced for unassigned public responders
  approxLng: number;
  
  // Context
  observedAt: string;
  isAnimalStillThere: boolean;
  canReporterStayNearby: boolean;
  preferredContactMethod: 'phone' | 'whatsapp' | 'in_app';

  // Reporter & Location Contact Details (Accessible by verified associations/responders)
  reporterContactName?: string;
  reporterContactPhone?: string;
  reporterAddress?: string; // Reporter's home / current residence address
  exactAddress?: string; // Animal exact spot / street / landmark
  landmark?: string;
  accessNotes?: string;
  stayWithAnimal?: boolean;
  
  // Status & Responsibility
  status: ReportStatus;
  isAssigned: boolean;
  leadResponderId?: string;
  leadResponderName?: string;
  leadResponderType?: ResponderType;
  leadAcceptedAt?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerRole?: VolunteerRole;
  
  // Media & Timeline
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
  
  // Dynamic fields
  timeline?: ReportTimelineEvent[];
  publicUpdates?: ReportUpdate[];
  privateNotes?: ReportPrivateNote[];
  collaborators?: ReportCollaborator[];
}

export interface ReportPrivateDetails {
  reportId: string;
  reporterPhone: string;
  reporterAddress: string;
  exactLat: number;
  exactLng: number;
  privateNotes: string;
}

export interface ReportTimelineEvent {
  id: string;
  reportId: string;
  previousStatus?: ReportStatus;
  newStatus: ReportStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'system';
  actorType?: ResponderType;
  explanation?: string;
  createdAt: string;
}

export interface ReportUpdate {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  authorType: ResponderType;
  title: string;
  content: string;
  mediaUrls?: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface ReportPrivateNote {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export type CollaborationRole = 
  | 'rescue' 
  | 'veterinary_care' 
  | 'shelter' 
  | 'foster' 
  | 'transport' 
  | 'food_support' 
  | 'adoption';

export interface ReportCollaborator {
  id: string;
  reportId: string;
  responderId: string;
  responderName: string;
  responderType: ResponderType;
  requestedRole: CollaborationRole;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string;
  notes?: string;
}

// Adoption System Types
export type AdoptionStatus = 'draft' | 'published' | 'reserved' | 'adopted' | 'archived';
export type AnimalSex = 'male' | 'female' | 'unknown';
export type AnimalSize = 'small' | 'medium' | 'large';
export type AgeGroup = 'baby' | 'young' | 'adult' | 'senior';

export interface AdoptionListing {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherRole: UserRole;
  publisherType?: ResponderType;
  
  // Animal Info
  name: string;
  animalType: AnimalType;
  breed?: string;
  sex: AnimalSex;
  ageGroup: AgeGroup;
  estimatedAge: string; // e.g. "8 أشهر", "سنتان"
  size: AnimalSize;
  
  // Health & Personality
  healthCondition: string;
  isVaccinated: boolean;
  isNeutered: boolean;
  specialNeeds?: string;
  isUrgent: boolean;
  personality: string[]; // ['friendly', 'calm', 'playful', 'good_with_kids', etc.]
  description: string;
  
  // Compatibility
  goodWithChildren: boolean;
  goodWithCats: boolean;
  goodWithDogs: boolean;
  
  // Location & Media
  governorate: string;
  city: string;
  photos: string[];
  videoUrl?: string;
  
  // Status
  status: AdoptionStatus;
  listingType?: 'adoption' | 'surrender';
  surrenderReason?: string;
  contactPhone?: string;
  applicationsCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionApplication {
  id: string;
  listingId: string;
  listingName: string;
  listingPhoto: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantCity: string;
  housingType: 'apartment' | 'house_with_garden' | 'farm' | 'other';
  hasOtherPets: boolean;
  previousPetExperience: string;
  motivation: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  publisherFeedback?: string;
  publisherNotes?: string;
  submittedAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType =
  | 'phone_verified'
  | 'responder_approved'
  | 'responder_rejected'
  | 'report_submitted'
  | 'urgent_report_nearby'
  | 'responsibility_accepted'
  | 'responder_on_way'
  | 'report_status_updated'
  | 'collaboration_invited'
  | 'collaboration_responded'
  | 'public_update_posted'
  | 'adoption_application_received'
  | 'adoption_status_changed'
  | 'volunteer_dispatch_request'
  | 'volunteer_welcome'
  | 'case_resolved';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleFr: string;
  bodyAr: string;
  bodyFr: string;
  relatedReportId?: string;
  relatedAdoptionId?: string;
  isRead: boolean;
  createdAt: string;
}
