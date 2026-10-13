import { 
  AnimalReport, 
  ProblemCategory,
  AdoptionListing, 
  AdoptionApplication, 
  AppNotification, 
  UserProfile, 
  ResponderProfile, 
  ResponderDocument,
  ReportStatus, 
  ReportTimelineEvent, 
  ReportUpdate, 
  ReportPrivateNote, 
  ReportCollaborator, 
  CollaborationRole, 
  ReportPrivateDetails, 
  VolunteerProfile, 
  VolunteerDispatchRequest, 
  VolunteerRole,
  VerificationStatus
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Explicitly identified demonstration IDs filtered out for clean production state
const DEMO_REPORT_IDS = new Set([
  'rep_dam_01', 'rep_alp_01', 'rep_hms_01', 'rep_ltk_01', 'rep_dam_02', 'rep_dam_03'
]);
const DEMO_ADOPTION_IDS = new Set([
  'adopt_01', 'adopt_02', 'adopt_03', 'adopt_04', 'adopt_05', 'adopt_06'
]);
const DEMO_RESPONDER_IDS = new Set([
  'resp_assoc_01', 'resp_vet_01', 'resp_assoc_02'
]);
const DEMO_VOLUNTEER_IDS = new Set([
  'vol_01', 'vol_02', 'vol_03', 'vol_04'
]);
const DEMO_DISPATCH_IDS = new Set([
  'disp_01', 'disp_02', 'disp_03'
]);
const DEMO_NOTIFICATION_IDS = new Set([
  'notif_01', 'notif_02', 'notif_03'
]);

class DataService {
  private reports: AnimalReport[] = [];
  private adoptions: AdoptionListing[] = [];
  private applications: AdoptionApplication[] = [];
  private notifications: AppNotification[] = [];
  private responders: ResponderProfile[] = [];
  private volunteers: VolunteerProfile[] = [];
  private dispatches: VolunteerDispatchRequest[] = [];
  private privateDetails: Map<string, ReportPrivateDetails> = new Map();
  private subscribers: (() => void)[] = [];

  constructor() {
    this.initLocalStore();
    // Proactively sync from Supabase on initialization
    this.refreshAllFromSupabase();
  }

  private initLocalStore() {
    // 1. Reports
    const savedReports = localStorage.getItem('hema_reports') || localStorage.getItem('mawa_reports');
    if (savedReports) {
      try {
        const parsed: AnimalReport[] = JSON.parse(savedReports);
        this.reports = parsed.filter(r => !DEMO_REPORT_IDS.has(r.id) && !r.referenceNumber?.startsWith('MAWA-2026-'));
      } catch (e) {
        this.reports = [];
      }
    } else {
      this.reports = [];
    }

    // 2. Adoptions
    const savedAdoptions = localStorage.getItem('hema_adoptions') || localStorage.getItem('mawa_adoptions');
    if (savedAdoptions) {
      try {
        const parsed: AdoptionListing[] = JSON.parse(savedAdoptions);
        this.adoptions = parsed.filter(a => !DEMO_ADOPTION_IDS.has(a.id));
      } catch (e) {
        this.adoptions = [];
      }
    } else {
      this.adoptions = [];
    }

    // 3. Applications
    const savedApplications = localStorage.getItem('hema_applications') || localStorage.getItem('mawa_applications');
    if (savedApplications) {
      try {
        this.applications = JSON.parse(savedApplications);
      } catch (e) {
        this.applications = [];
      }
    } else {
      this.applications = [];
    }

    // 4. Notifications
    const savedNotifications = localStorage.getItem('hema_notifications') || localStorage.getItem('mawa_notifications');
    if (savedNotifications) {
      try {
        const parsed: AppNotification[] = JSON.parse(savedNotifications);
        this.notifications = parsed.filter(n => !DEMO_NOTIFICATION_IDS.has(n.id));
      } catch (e) {
        this.notifications = [];
      }
    } else {
      this.notifications = [];
    }

    // 5. Responders
    const savedResponders = localStorage.getItem('hema_responders') || localStorage.getItem('mawa_responders');
    if (savedResponders) {
      try {
        const parsed: ResponderProfile[] = JSON.parse(savedResponders);
        this.responders = parsed.filter(r => !DEMO_RESPONDER_IDS.has(r.id));
      } catch (e) {
        this.responders = [];
      }
    } else {
      this.responders = [];
    }

    // 6. Volunteers
    const savedVolunteers = localStorage.getItem('hema_volunteers') || localStorage.getItem('mawa_volunteers');
    if (savedVolunteers) {
      try {
        const parsed: VolunteerProfile[] = JSON.parse(savedVolunteers);
        this.volunteers = parsed.filter(v => !DEMO_VOLUNTEER_IDS.has(v.id));
      } catch (e) {
        this.volunteers = [];
      }
    } else {
      this.volunteers = [];
    }

    // 7. Dispatches
    const savedDispatches = localStorage.getItem('hema_dispatches') || localStorage.getItem('mawa_dispatches');
    if (savedDispatches) {
      try {
        const parsed: VolunteerDispatchRequest[] = JSON.parse(savedDispatches);
        this.dispatches = parsed.filter(d => !DEMO_DISPATCH_IDS.has(d.id));
      } catch (e) {
        this.dispatches = [];
      }
    } else {
      this.dispatches = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem('hema_reports', JSON.stringify(this.reports));
      localStorage.setItem('hema_adoptions', JSON.stringify(this.adoptions));
      localStorage.setItem('hema_applications', JSON.stringify(this.applications));
      localStorage.setItem('hema_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('hema_responders', JSON.stringify(this.responders));
      localStorage.setItem('hema_volunteers', JSON.stringify(this.volunteers));
      localStorage.setItem('hema_dispatches', JSON.stringify(this.dispatches));
    } catch (e) {
      // Ignore quota errors in private browsing
    }
    this.notifySubscribers();
  }

  public subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Subscriber callback error:', err);
      }
    });
  }

  /**
   * Refreshes all primary data sets asynchronously from Supabase.
   */
  public async refreshAllFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await Promise.allSettled([
        this.getAdoptions(),
        this.getReports(),
        this.getResponders(),
        this.getVolunteers()
      ]);
    } catch (err) {
      console.warn('Initial Supabase sync completed with partial data:', err);
    }
  }

  // ====================================================================
  // ADOPTION & SURRENDER SYSTEM (Fixes Cross-Browser & Guest Persistence)
  // ====================================================================

  public async getAdoptions(): Promise<AdoptionListing[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adoption_listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: AdoptionListing[] = data.map((row: any) => ({
            id: row.id,
            publisherId: row.publisher_id,
            publisherName: row.publisher_name || 'ناشر الإعلان',
            publisherRole: row.publisher_role || 'citizen',
            name: row.name,
            animalType: row.animal_type,
            breed: row.breed,
            sex: row.sex || 'unknown',
            ageGroup: row.age_group || 'young',
            estimatedAge: row.estimated_age,
            size: row.size || 'medium',
            healthCondition: row.health_condition,
            isVaccinated: Boolean(row.is_vaccinated),
            isNeutered: Boolean(row.is_neutered),
            specialNeeds: row.special_needs,
            isUrgent: Boolean(row.is_urgent),
            personality: Array.isArray(row.personality) ? row.personality : [],
            description: row.description,
            goodWithChildren: Boolean(row.good_with_children),
            goodWithCats: Boolean(row.good_with_cats),
            goodWithDogs: Boolean(row.good_with_dogs),
            governorate: row.governorate,
            city: row.city,
            photos: Array.isArray(row.photos) ? row.photos : (row.photo_url ? [row.photo_url] : []),
            videoUrl: row.video_url,
            status: row.status,
            applicationsCount: row.applications_count || 0,
            listingType: row.listing_type || 'adoption',
            surrenderReason: row.surrender_reason,
            contactPhone: row.contact_phone,
            publishedAt: row.published_at || row.created_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          this.adoptions = mapped;
          this.saveState();
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getAdoptions failed, using cached state:', err);
      }
    }

    return [...this.adoptions];
  }

  public async getAdoptionById(id: string): Promise<AdoptionListing | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adoption_listings')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            publisherId: data.publisher_id,
            publisherName: data.publisher_name || 'ناشر الإعلان',
            publisherRole: data.publisher_role || 'citizen',
            name: data.name,
            animalType: data.animal_type,
            breed: data.breed,
            sex: data.sex || 'unknown',
            ageGroup: data.age_group || 'young',
            estimatedAge: data.estimated_age,
            size: data.size || 'medium',
            healthCondition: data.health_condition,
            isVaccinated: Boolean(data.is_vaccinated),
            isNeutered: Boolean(data.is_neutered),
            specialNeeds: data.special_needs,
            isUrgent: Boolean(data.is_urgent),
            personality: Array.isArray(data.personality) ? data.personality : [],
            description: data.description,
            goodWithChildren: Boolean(data.good_with_children),
            goodWithCats: Boolean(data.good_with_cats),
            goodWithDogs: Boolean(data.good_with_dogs),
            governorate: data.governorate,
            city: data.city,
            photos: Array.isArray(data.photos) ? data.photos : [],
            videoUrl: data.video_url,
            status: data.status,
            applicationsCount: data.applications_count || 0,
            listingType: data.listing_type || 'adoption',
            surrenderReason: data.surrender_reason,
            contactPhone: data.contact_phone,
            publishedAt: data.published_at || data.created_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    return this.adoptions.find(a => a.id === id) || null;
  }

  public async createAdoptionListing(
    listing: Omit<AdoptionListing, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount'>
  ): Promise<AdoptionListing> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload: any = {
          publisher_id: listing.publisherId,
          name: listing.name,
          animal_type: listing.animalType,
          breed: listing.breed || null,
          sex: listing.sex || 'unknown',
          age_group: listing.ageGroup || 'young',
          estimated_age: listing.estimatedAge,
          size: listing.size || 'medium',
          health_condition: listing.healthCondition,
          is_vaccinated: listing.isVaccinated ?? false,
          is_neutered: listing.isNeutered ?? false,
          special_needs: listing.specialNeeds || null,
          is_urgent: listing.isUrgent ?? false,
          personality: listing.personality || [],
          description: listing.description,
          good_with_children: listing.goodWithChildren ?? true,
          good_with_cats: listing.goodWithCats ?? true,
          good_with_dogs: listing.goodWithDogs ?? true,
          governorate: listing.governorate,
          city: listing.city,
          photos: listing.photos || [],
          video_url: listing.videoUrl || null,
          status: listing.status || 'published',
          applications_count: 0,
          listing_type: listing.listingType || 'adoption',
          surrender_reason: listing.surrenderReason || null,
          contact_phone: listing.contactPhone || null,
          published_at: listing.publishedAt || now
        };

        const { data, error } = await supabase
          .from('adoption_listings')
          .insert(dbPayload)
          .select()
          .single();

        if (!error && data) {
          const createdListing: AdoptionListing = {
            ...listing,
            id: data.id,
            applicationsCount: 0,
            createdAt: data.created_at || now,
            updatedAt: data.updated_at || now
          };

          this.adoptions.unshift(createdListing);
          this.saveState();
          return createdListing;
        } else if (error) {
          console.error('Supabase createAdoptionListing error:', error);
        }
      } catch (err) {
        console.error('Failed to create adoption in Supabase:', err);
      }
    }

    // Local fallback
    const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newListing: AdoptionListing = {
      ...listing,
      id: newId,
      applicationsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    this.adoptions.unshift(newListing);
    this.saveState();
    return newListing;
  }

  public async deleteAdoptionListing(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('adoption_listings').delete().eq('id', id);
        if (error) console.error('Error deleting adoption listing:', error);
      } catch (e) {}
    }
    this.adoptions = this.adoptions.filter(a => a.id !== id);
    this.saveState();
    return true;
  }

  public async applyForAdoption(
    application: Omit<AdoptionApplication, 'id' | 'submittedAt' | 'updatedAt' | 'status'>
  ): Promise<AdoptionApplication> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adoption_applications')
          .insert({
            listing_id: application.listingId,
            applicant_id: application.applicantId,
            housing_type: application.housingType,
            has_other_pets: application.hasOtherPets,
            previous_pet_experience: application.previousPetExperience,
            motivation: application.motivation,
            status: 'pending'
          })
          .select()
          .single();

        if (!error && data) {
          const newApp: AdoptionApplication = {
            ...application,
            id: data.id,
            status: 'pending',
            submittedAt: data.submitted_at || now,
            updatedAt: data.updated_at || now
          };

          this.applications.unshift(newApp);

          // Increment listing applications count
          const listing = this.adoptions.find(a => a.id === application.listingId);
          if (listing) {
            listing.applicationsCount = (listing.applicationsCount || 0) + 1;
            await supabase
              .from('adoption_listings')
              .update({ applications_count: listing.applicationsCount })
              .eq('id', listing.id);

            // Notify publisher
            await this.addNotification({
              userId: listing.publisherId,
              type: 'adoption_application_received',
              titleAr: '🐾 طلب تبني جديد على إعلانك',
              titleFr: '🐾 Nouvelle demande d’adoption pour votre annonce',
              bodyAr: `تلقيت طلب تبني من ${application.applicantName} للحيوان "${listing.name}".`,
              bodyFr: `Nouvelle demande d’adoption de ${application.applicantName} pour "${listing.name}".`,
              relatedAdoptionId: listing.id
            });
          }

          this.saveState();
          return newApp;
        }
      } catch (err) {
        console.error('Supabase applyForAdoption error:', err);
      }
    }

    const newId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newApp: AdoptionApplication = {
      ...application,
      id: newId,
      status: 'pending',
      submittedAt: now,
      updatedAt: now
    };

    this.applications.unshift(newApp);
    const listing = this.adoptions.find(a => a.id === application.listingId);
    if (listing) {
      listing.applicationsCount = (listing.applicationsCount || 0) + 1;
      this.addNotification({
        userId: listing.publisherId,
        type: 'adoption_application_received',
        titleAr: '🐾 طلب تبني جديد على إعلانك',
        titleFr: '🐾 Nouvelle demande d’adoption pour votre annonce',
        bodyAr: `تلقيت طلب تبني من ${application.applicantName} للحيوان "${listing.name}".`,
        bodyFr: `Nouvelle demande d’adoption de ${application.applicantName} pour "${listing.name}".`,
        relatedAdoptionId: listing.id
      });
    }

    this.saveState();
    return newApp;
  }

  public async getApplicationsForUser(userId: string): Promise<AdoptionApplication[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adoption_applications')
          .select('*, listing:adoption_listings(name, photos, publisher_id)')
          .or(`applicant_id.eq.${userId}`);

        if (!error && data) {
          const mapped: AdoptionApplication[] = data.map((row: any) => ({
            id: row.id,
            listingId: row.listing_id,
            listingName: row.listing?.name || 'حيوان معروض للتبني',
            listingPhoto: row.listing?.photos?.[0] || '',
            applicantId: row.applicant_id,
            applicantName: row.applicant_name || 'مقدم الطلب',
            applicantPhone: row.applicant_phone || '',
            applicantCity: row.applicant_city || '',
            housingType: row.housing_type,
            hasOtherPets: row.has_other_pets,
            previousPetExperience: row.previous_pet_experience,
            motivation: row.motivation,
            status: row.status,
            publisherFeedback: row.publisher_feedback,
            publisherNotes: row.publisher_notes,
            submittedAt: row.submitted_at,
            updatedAt: row.updated_at
          }));
          return mapped;
        }
      } catch (err) {}
    }

    const mySubmissions = this.applications.filter(a => a.applicantId === userId);
    const myListingsIds = new Set(this.adoptions.filter(l => l.publisherId === userId).map(l => l.id));
    const receivedForMyListings = this.applications.filter(a => myListingsIds.has(a.listingId));
    return Array.from(new Set([...mySubmissions, ...receivedForMyListings]));
  }

  // ====================================================================
  // EMERGENCY REPORTING & OPERATIONS ROOM SYSTEM
  // ====================================================================

  public async getReports(
    user?: UserProfile | null, 
    responderProfile?: ResponderProfile | null
  ): Promise<AnimalReport[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            media:report_media(*),
            details:report_private_details(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: AnimalReport[] = data.map((row: any) => {
            const hasMedia = Array.isArray(row.media) && row.media.length > 0;
            const mediaList = hasMedia ? row.media.map((m: any) => ({
              id: m.id,
              url: m.media_url,
              type: m.media_type || 'image',
              caption: m.caption,
              createdAt: m.created_at
            })) : [];

            // Cache private details if present in authorized query
            if (row.details && Array.isArray(row.details) && row.details.length > 0) {
              const det = row.details[0];
              this.privateDetails.set(row.id, {
                reportId: row.id,
                reporterPhone: det.reporter_phone,
                reporterAddress: det.reporter_address || `${row.neighborhood}, ${row.city}`,
                exactLat: Number(det.exact_lat || row.approx_lat),
                exactLng: Number(det.exact_lng || row.approx_lng),
                privateNotes: det.private_notes || ''
              });
            }

            return {
              id: row.id,
              referenceNumber: row.reference_number,
              reporterId: row.reporter_id,
              animalType: row.animal_type,
              animalCount: row.animal_count || 1,
              problemCategory: row.problem_category,
              severity: row.severity,
              description: row.description,
              governorate: row.governorate,
              city: row.city,
              neighborhood: row.neighborhood,
              lat: Number(row.approx_lat),
              lng: Number(row.approx_lng),
              approxLat: Number(row.approx_lat),
              approxLng: Number(row.approx_lng),
              observedAt: row.observed_at || row.created_at,
              isAnimalStillThere: Boolean(row.is_animal_still_there),
              canReporterStayNearby: Boolean(row.can_reporter_stay_nearby),
              preferredContactMethod: row.preferred_contact_method || 'phone',
              status: row.status,
              isAssigned: Boolean(row.is_assigned),
              leadResponderId: row.lead_responder_id,
              leadAcceptedAt: row.lead_accepted_at,
              assignedVolunteerId: row.assigned_volunteer_id,
              media: mediaList,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          });

          this.reports = mapped;
          this.saveState();
          return mapped.map(r => this.filterReportPrivacy(r, user, responderProfile));
        }
      } catch (err) {
        console.warn('Supabase fetch reports failed, falling back to local state:', err);
      }
    }

    return this.reports.map(r => this.filterReportPrivacy(r, user, responderProfile));
  }

  public async getReportById(
    id: string, 
    user?: UserProfile | null, 
    responderProfile?: ResponderProfile | null
  ): Promise<AnimalReport | null> {
    const report = this.reports.find(r => r.id === id);
    if (!report) return null;
    return this.filterReportPrivacy(report, user, responderProfile);
  }

  public async getReportPrivateDetails(
    reportId: string, 
    user?: UserProfile | null, 
    responderProfile?: ResponderProfile | null
  ): Promise<ReportPrivateDetails | null> {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return null;

    const isOwner = user?.id === report.reporterId;
    const isApprovedResp = responderProfile && responderProfile.verificationStatus === 'verified';
    const isAdmin = Boolean(user?.isAdmin || (user?.email && user.email.toLowerCase() === 'sameh.saad.cg@gmail.com'));

    if (isOwner || isApprovedResp || isAdmin) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('report_private_details')
            .select('*')
            .eq('report_id', reportId)
            .single();

          if (data) {
            return {
              reportId: data.report_id,
              reporterPhone: data.reporter_phone,
              reporterAddress: data.reporter_address || `${report.neighborhood}, ${report.city}`,
              exactLat: Number(data.exact_lat || report.lat),
              exactLng: Number(data.exact_lng || report.lng),
              privateNotes: data.private_notes || 'معلومات الاتصال المباشرة للمستجيب المعتمد.'
            };
          }
        } catch (e) {}
      }

      return this.privateDetails.get(reportId) || {
        reportId,
        reporterPhone: report.reporterContactPhone || '+963955654321',
        reporterAddress: `${report.neighborhood}, ${report.city}`,
        exactLat: report.lat,
        exactLng: report.lng,
        privateNotes: 'معلومات الاتصال المباشرة للمستجيب المعتمد.'
      };
    }

    return null;
  }

  private filterReportPrivacy(
    report: AnimalReport, 
    user?: UserProfile | null, 
    responderProfile?: ResponderProfile | null
  ): AnimalReport {
    const isOwner = user?.id === report.reporterId;
    const isApprovedResp = responderProfile && responderProfile.verificationStatus === 'verified';
    const isAdmin = Boolean(user?.isAdmin || (user?.email && user.email.toLowerCase() === 'sameh.saad.cg@gmail.com'));

    if (isOwner || isApprovedResp || isAdmin) {
      return { ...report };
    }

    // Mask for unapproved/guest users
    return {
      ...report,
      lat: report.approxLat,
      lng: report.approxLng,
      reporterName: 'مواطن مسجل (معلومات محمية)',
      privateNotes: undefined
    };
  }

  public async createReport(
    reportData: any,
    exactDetails?: { phone?: string; address?: string }
  ): Promise<AnimalReport> {
    const uniqueRef = `HEMA-${new Date().getFullYear()}-${(reportData.governorate || 'DAM').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Normalize problem category to valid Supabase enum value
    const normalizeCategoryForDb = (cat?: string): string => {
      if (!cat) return 'injured';
      if (cat === 'injury' || cat === 'injured') return 'injured';
      if (cat === 'violence' || cat === 'abuse_violence') return 'abuse_violence';
      if (cat === 'sickness' || cat === 'sick') return 'sick';
      if (cat === 'abandonment' || cat === 'abandoned') return 'abandoned';
      if (cat === 'entrapment' || cat === 'trapped') return 'trapped';
      if (cat === 'homelessness' || cat === 'homeless') return 'homeless';
      const validEnums = [
        'abuse_violence', 'injured', 'sick', 'abandoned',
        'homeless', 'trapped', 'road_accident', 'poisoning',
        'food_water', 'mother_babies', 'shelter_needed', 'other_emergency'
      ];
      return validEnums.includes(cat) ? cat : 'injured';
    };

    // Normalize severity to valid Supabase enum value ('low' | 'medium' | 'high' | 'critical')
    const normalizeSeverityForDb = (sev?: string): 'low' | 'medium' | 'high' | 'critical' => {
      if (!sev) return 'medium';
      if (sev === 'critical') return 'critical';
      if (sev === 'urgent' || sev === 'high') return 'high';
      if (sev === 'moderate' || sev === 'medium') return 'medium';
      if (sev === 'low') return 'low';
      return 'medium';
    };

    const targetCategory = normalizeCategoryForDb(reportData.situationType || reportData.problemCategory);
    const targetSeverity = normalizeSeverityForDb(reportData.severity);

    if (isSupabaseConfigured && supabase) {
      try {
        const reportPayload: any = {
          reference_number: uniqueRef,
          reporter_id: reportData.reporterId,
          animal_type: reportData.animalType || 'dog',
          animal_count: reportData.animalCount || 1,
          problem_category: targetCategory,
          severity: targetSeverity,
          description: reportData.description,
          governorate: reportData.governorate || 'damascus',
          city: reportData.city || 'دمشق',
          neighborhood: reportData.neighborhood || 'حي عام',
          approx_lat: reportData.lat,
          approx_lng: reportData.lng,
          is_animal_still_there: reportData.isAnimalStillThere ?? true,
          can_reporter_stay_nearby: reportData.stayWithAnimal ?? false,
          preferred_contact_method: 'phone',
          status: 'submitted',
          is_assigned: false
        };

        const { data: createdRow, error } = await supabase
          .from('reports')
          .insert(reportPayload)
          .select()
          .single();

        if (!error && createdRow) {
          const reportId = createdRow.id;

          // Insert private contact & exact coordinates
          await supabase.from('report_private_details').insert({
            report_id: reportId,
            reporter_phone: exactDetails?.phone || reportData.reporterContactPhone || '',
            reporter_address: exactDetails?.address || reportData.reporterAddress || `${reportData.neighborhood}, ${reportData.city}`,
            exact_lat: reportData.lat,
            exact_lng: reportData.lng,
            private_notes: 'بلاغ مقدم عبر منصة حِمى الوطنية.'
          });

          // Insert media items if any
          if (Array.isArray(reportData.media) && reportData.media.length > 0) {
            const mediaInserts = reportData.media.map((m: any) => ({
              report_id: reportId,
              media_url: m.url,
              media_type: m.mediaType || 'image',
              caption: m.caption || 'صورة توثيقية'
            }));
            await supabase.from('report_media').insert(mediaInserts);
          }

          // Initial timeline event
          await supabase.from('report_status_history').insert({
            report_id: reportId,
            new_status: 'submitted',
            actor_id: reportData.reporterId,
            explanation: 'تم تقديم البلاغ وتثبيت الموقع على الخريطة.'
          });

          const newReport: AnimalReport = {
            id: reportId,
            referenceNumber: uniqueRef,
            reporterId: reportData.reporterId,
            reporterName: reportData.reporterContactName || reportData.reporterName || 'مواطن',
            animalType: reportData.animalType,
            animalCount: reportData.animalCount || 1,
            problemCategory: targetCategory as ProblemCategory,
            severity: targetSeverity,
            description: reportData.description,
            governorate: reportData.governorate,
            city: reportData.city,
            neighborhood: reportData.neighborhood,
            lat: reportData.lat,
            lng: reportData.lng,
            approxLat: reportData.lat,
            approxLng: reportData.lng,
            observedAt: now,
            isAnimalStillThere: reportData.isAnimalStillThere ?? true,
            canReporterStayNearby: reportData.stayWithAnimal ?? false,
            preferredContactMethod: 'phone',
            status: 'submitted',
            isAssigned: false,
            media: reportData.media || [],
            createdAt: now,
            updatedAt: now
          };

          this.reports.unshift(newReport);
          this.privateDetails.set(reportId, {
            reportId,
            reporterPhone: exactDetails?.phone || reportData.reporterContactPhone || '',
            reporterAddress: exactDetails?.address || `${reportData.neighborhood}, ${reportData.city}`,
            exactLat: reportData.lat,
            exactLng: reportData.lng,
            privateNotes: 'معلومات المبلّغ مسجلة عبر النظام.'
          });

          // Targeted Local Notifications for Associations in this City/Governorate
          await this.notifyLocalResponders(newReport, exactDetails);

          this.saveState();
          return newReport;
        } else if (error) {
          console.error('Supabase createReport error:', error);
        }
      } catch (err) {
        console.error('Failed to create report in Supabase:', err);
      }
    }

    // Local fallback
    const newId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReport: AnimalReport = {
      ...reportData,
      id: newId,
      referenceNumber: uniqueRef,
      problemCategory: targetCategory as ProblemCategory,
      severity: targetSeverity,
      status: 'waiting_responder',
      isAssigned: false,
      createdAt: now,
      updatedAt: now
    };

    this.reports.unshift(newReport);
    this.privateDetails.set(newId, {
      reportId: newId,
      reporterPhone: exactDetails?.phone || reportData.reporterContactPhone || '',
      reporterAddress: exactDetails?.address || `${reportData.neighborhood}, ${reportData.city}`,
      exactLat: reportData.lat,
      exactLng: reportData.lng,
      privateNotes: 'معلومات المبلّغ مسجلة عبر النظام.'
    });

    this.notifyLocalResponders(newReport, exactDetails);
    this.saveState();
    return newReport;
  }

  /**
   * Section 6 & 29: Automatic notifications for new emergency reports target
   * Associations and Vets operating in the relevant city / governorate.
   */
  private async notifyLocalResponders(report: AnimalReport, exactDetails?: any): Promise<void> {
    const matchingResponders = this.responders.filter(
      r => r.verificationStatus === 'verified' && r.governoratesServed?.includes(report.governorate)
    );

    const reporterName = report.reporterName || 'مواطن';
    const reporterPhone = exactDetails?.phone || '+963955654321';
    const animalSpot = `${report.city} - ${report.neighborhood}`;

    for (const responder of matchingResponders) {
      await this.addNotification({
        userId: responder.userId,
        type: 'urgent_report_nearby',
        titleAr: `🚨 بلاغ استغاثة جديد: ${report.city} (${report.referenceNumber})`,
        titleFr: `🚨 Signalement d’urgence: ${report.city} (${report.referenceNumber})`,
        bodyAr: `👤 المبلّغ: ${reporterName} | 📍 موقع الحيوان: ${animalSpot} | 📝 الوصف: ${report.description.substring(0, 70)}...`,
        bodyFr: `👤 Déclarant: ${reporterName} | 📍 Emplacement: ${animalSpot}`,
        relatedReportId: report.id
      });
    }
  }

  // Atomic Accept Responsibility
  public async acceptReportResponsibility(
    reportId: string,
    responder: ResponderProfile,
    initialNotes?: string
  ): Promise<{ success: boolean; message?: string }> {
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return { success: false, message: 'Report not found' };

    const report = this.reports[reportIndex];
    if (report.isAssigned && report.leadResponderId) {
      return { success: false, message: 'هذا البلاغ تم قبول مسؤوليته بالفعل من قبل جهة أخرى.' };
    }

    if (responder.verificationStatus !== 'verified') {
      return { success: false, message: 'يتطلب قبول الحالات اعتماد الحساب رسمياً.' };
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reports').update({
          is_assigned: true,
          lead_responder_id: responder.id,
          lead_accepted_at: now,
          status: 'responsibility_accepted'
        }).eq('id', reportId);

        await supabase.from('report_responsibilities').insert({
          report_id: reportId,
          responder_id: responder.id,
          is_active: true
        });

        await supabase.from('report_status_history').insert({
          report_id: reportId,
          new_status: 'responsibility_accepted',
          actor_id: responder.userId,
          explanation: initialNotes || `تم قبول مسؤولية الحالة من قبل ${responder.name}.`
        });

        await supabase.from('report_updates').insert({
          report_id: reportId,
          author_id: responder.userId,
          title: 'بدء الاستجابة والتحرك الميداني',
          content: initialNotes || `تم قبول البلاغ من قبل ${responder.name}. فريق العمليات يتابع الحالة حالياً.`,
          is_public: true
        });
      } catch (err) {
        console.error('Supabase acceptReportResponsibility error:', err);
      }
    }

    const updatedReport: AnimalReport = {
      ...report,
      isAssigned: true,
      leadResponderId: responder.id,
      leadResponderName: responder.name,
      leadResponderType: responder.responderType,
      leadAcceptedAt: now,
      status: 'responsibility_accepted',
      updatedAt: now
    };

    this.reports[reportIndex] = updatedReport;

    // Notify citizen reporter
    await this.addNotification({
      userId: report.reporterId,
      type: 'responsibility_accepted',
      titleAr: 'تم قبول مسؤولية بلاغك الإسعافي',
      titleFr: 'Prise en charge de votre signalement',
      bodyAr: `قامت ${responder.name} بقبول بلاغك رقم ${report.referenceNumber} وبدء التنسيق الميداني.`,
      bodyFr: `${responder.name} a pris en charge votre signalement ${report.referenceNumber}.`,
      relatedReportId: report.id
    });

    this.saveState();
    return { success: true };
  }

  public async updateReportStatus(
    reportId: string,
    newStatus: ReportStatus,
    updater: string | { userId: string; name: string; type: 'association' | 'veterinarian' },
    explanation: string,
    isPublicUpdate: boolean = true,
    mediaUrls: string[] = []
  ): Promise<AnimalReport | null> {
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return null;

    const report = this.reports[reportIndex];
    const now = new Date().toISOString();

    let actorId = 'usr_unknown';
    let actorName = 'مستجيب معتمد';
    let actorType: 'association' | 'veterinarian' = 'association';

    if (typeof updater === 'string') {
      const resp = this.responders.find(r => r.id === updater);
      if (resp) {
        actorId = resp.userId;
        actorName = resp.name;
        actorType = resp.responderType;
      }
    } else {
      actorId = updater.userId;
      actorName = updater.name;
      actorType = updater.type;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reports').update({
          status: newStatus,
          updated_at: now
        }).eq('id', reportId);

        await supabase.from('report_status_history').insert({
          report_id: reportId,
          previous_status: report.status,
          new_status: newStatus,
          actor_id: actorId,
          explanation
        });

        if (isPublicUpdate) {
          await supabase.from('report_updates').insert({
            report_id: reportId,
            author_id: actorId,
            title: `تحديث الحالة إلى: ${newStatus}`,
            content: explanation,
            media_urls: mediaUrls,
            is_public: true
          });
        }
      } catch (err) {
        console.error('Supabase updateReportStatus error:', err);
      }
    }

    const updatedTimeline: ReportTimelineEvent = {
      id: `tl_${Date.now()}`,
      reportId: report.id,
      previousStatus: report.status,
      newStatus,
      actorId,
      actorName,
      actorRole: 'responder',
      actorType,
      explanation,
      createdAt: now
    };

    const updated: AnimalReport = {
      ...report,
      status: newStatus,
      updatedAt: now,
      timeline: [...(report.timeline || []), updatedTimeline]
    };

    this.reports[reportIndex] = updated;

    // Notify citizen reporter of update
    await this.addNotification({
      userId: report.reporterId,
      type: 'report_status_updated',
      titleAr: `تحديث جديد حول بلاغك ${report.referenceNumber}`,
      titleFr: `Mise à jour du signalement ${report.referenceNumber}`,
      bodyAr: explanation,
      bodyFr: explanation,
      relatedReportId: report.id
    });

    this.saveState();
    return updated;
  }

  // ====================================================================
  // RESPONDER PROFILES & ADMIN VERIFICATION
  // ====================================================================

  public async getResponders(): Promise<ResponderProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('responder_profiles')
          .select('*, responder_documents(*)');

        if (!error && data) {
          const mapped: ResponderProfile[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            responderType: row.responder_type,
            verificationStatus: row.verification_status,
            name: row.name,
            title: row.title,
            specialty: row.specialty,
            description: row.description || '',
            responsibleContactPerson: row.responsible_contact_person,
            email: row.email,
            phone: row.phone,
            governoratesServed: row.governorates_served || [],
            citiesServed: row.cities_served || [],
            servicesOffered: row.services_offered || [],
            clinicName: row.clinic_name,
            clinicAddress: row.clinic_address,
            registrationNumber: row.registration_number,
            supportingDocumentUrls: row.supporting_document_urls || [],
            rejectionReason: row.rejection_reason,
            reviewedAt: row.reviewed_at,
            reviewedBy: row.reviewed_by,
            documents: Array.isArray(row.responder_documents) ? row.responder_documents.map((d: any) => ({
              id: d.id,
              responderId: d.responder_id,
              documentType: d.document_type,
              fileUrl: d.file_url,
              fileName: d.file_name,
              fileSizeKb: d.file_size_kb,
              uploadedAt: d.uploaded_at
            })) : [],
            availability: row.availability || 'available',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          this.responders = mapped;
          this.saveState();
          return mapped;
        }
      } catch (err) {}
    }

    return [...this.responders];
  }

  /**
   * Section 17: Admin approval or rejection of professional accounts.
   */
  public async reviewResponder(
    responderId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string,
    reviewerId?: string
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('responder_profiles')
          .update({
            verification_status: status,
            rejection_reason: status === 'rejected' ? (rejectionReason || 'لم يتم استيفاء الوثائق المطلوبة') : null,
            reviewed_at: now,
            reviewed_by: reviewerId || null,
            updated_at: now
          })
          .eq('id', responderId);

        if (error) {
          console.error('Supabase reviewResponder error:', error);
          return false;
        }
      } catch (err) {
        console.error('Failed to review responder in Supabase:', err);
      }
    }

    // Update in-memory
    const index = this.responders.findIndex(r => r.id === responderId);
    if (index !== -1) {
      this.responders[index] = {
        ...this.responders[index],
        verificationStatus: status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        reviewedAt: now,
        reviewedBy: reviewerId
      };

      // Notify the professional applicant
      const targetUser = this.responders[index].userId;
      if (status === 'verified') {
        await this.addNotification({
          userId: targetUser,
          type: 'responder_approved',
          titleAr: '🎉 تهانينا! تم اعتماد حسابكم المهني رسمياً',
          titleFr: '🎉 Compte professionnel validé avec succès',
          bodyAr: 'تمت مراجعة وثائقكم والتحقق منها بنجاح. أصبحت صلاحيات غرفة العمليات الوطنية وتنسيق المتطوعين مفعلة لحسابكم الآن.',
          bodyFr: 'Votre compte est officiellement vérifié. Accès à la salle des opérations accordé.'
        });
      } else {
        await this.addNotification({
          userId: targetUser,
          type: 'responder_rejected',
          titleAr: 'تنبيه حول طلب الاعتماد المهني',
          titleFr: 'Information sur votre demande de vérification',
          bodyAr: `تمت مراجعة طلبكم ولم تتم الموافقة عليه في الوقت الحالي. السبب: ${rejectionReason || 'يرجى استكمال الوثائق الثبوتية.'}`,
          bodyFr: `Votre demande n'a pas été validée: ${rejectionReason || 'Documents incomplets'}`
        });
      }
    }

    this.saveState();
    return true;
  }

  // ====================================================================
  // VOLUNTEER PROFILES & DISPATCH NETWORK
  // ====================================================================

  public async getVolunteers(): Promise<VolunteerProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('volunteer_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: VolunteerProfile[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            fullName: row.full_name,
            phone: row.phone,
            email: row.email,
            governorate: row.governorate,
            city: row.city,
            neighborhood: row.neighborhood,
            lat: row.lat ? Number(row.lat) : undefined,
            lng: row.lng ? Number(row.lng) : undefined,
            coverageRadiusKm: row.coverage_radius_km ? Number(row.coverage_radius_km) : undefined,
            roles: Array.isArray(row.roles) ? row.roles : [],
            hasVehicle: Boolean(row.has_vehicle),
            vehicleType: row.vehicle_type,
            shelterCapacityNote: row.shelter_capacity_note,
            otherHelpDetails: row.other_help_details,
            experienceNote: row.experience_note,
            availability: row.availability || 'available',
            verificationStatus: row.verification_status || 'active',
            totalAssistsCount: row.total_assists_count || 0,
            rating: Number(row.rating || 5.0),
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          this.volunteers = mapped;
          this.saveState();
          return mapped;
        }
      } catch (err) {}
    }

    return [...this.volunteers];
  }

  public getAllVolunteers(): VolunteerProfile[] {
    return [...this.volunteers];
  }

  public async sendVolunteerDispatch(
    dispatchData: Omit<VolunteerDispatchRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<VolunteerDispatchRequest> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('volunteer_dispatches')
          .insert({
            report_id: dispatchData.reportId || null,
            report_reference: dispatchData.reportReference || null,
            sender_id: dispatchData.senderId,
            sender_name: dispatchData.senderName,
            sender_type: dispatchData.senderType,
            volunteer_id: dispatchData.volunteerId,
            volunteer_name: dispatchData.volunteerName,
            role_needed: dispatchData.roleNeeded,
            governorate: dispatchData.governorate,
            city: dispatchData.city,
            neighborhood: dispatchData.neighborhood || null,
            address: dispatchData.address || null,
            urgency_level: dispatchData.urgencyLevel || 'normal',
            message: dispatchData.message,
            status: 'sent'
          })
          .select()
          .single();

        if (!error && data) {
          const newDispatch: VolunteerDispatchRequest = {
            ...dispatchData,
            id: data.id,
            status: 'sent',
            createdAt: data.created_at || now
          };

          this.dispatches.unshift(newDispatch);

          // Find volunteer user to send notification
          const volunteer = this.volunteers.find(v => v.id === dispatchData.volunteerId);
          if (volunteer) {
            await this.addNotification({
              userId: volunteer.userId,
              type: 'volunteer_dispatch_request',
              titleAr: `🚨 نداء استجابة عاجل: مطلوب مساعدة ميدانية`,
              titleFr: `Demande d'intervention urgente`,
              bodyAr: `أرسل لك ${dispatchData.senderName} طلباً للتعاون في ${dispatchData.city}: "${dispatchData.message}"`,
              bodyFr: `Alerte d'intervention par ${dispatchData.senderName}`,
              relatedReportId: dispatchData.reportId
            });
          }

          this.saveState();
          return newDispatch;
        }
      } catch (err) {
        console.error('Supabase sendVolunteerDispatch error:', err);
      }
    }

    const newDispatch: VolunteerDispatchRequest = {
      ...dispatchData,
      id: `disp_${Date.now()}`,
      status: 'sent',
      createdAt: now
    };

    this.dispatches.unshift(newDispatch);
    this.saveState();
    return newDispatch;
  }

  public async sendBatchVolunteerDispatches(
    volunteerIds: string[],
    dispatchData: Omit<VolunteerDispatchRequest, 'id' | 'createdAt' | 'status' | 'volunteerId' | 'volunteerName'>
  ): Promise<VolunteerDispatchRequest[]> {
    const results: VolunteerDispatchRequest[] = [];
    for (const volId of volunteerIds) {
      const vol = this.volunteers.find(v => v.id === volId);
      if (!vol) continue;
      const res = await this.sendVolunteerDispatch({
        ...dispatchData,
        volunteerId: vol.id,
        volunteerName: vol.fullName,
        governorate: vol.governorate,
        city: dispatchData.city || vol.city,
        address: dispatchData.address || vol.neighborhood
      });
      results.push(res);
    }
    return results;
  }

  public getVolunteerDispatches(volunteerId: string): VolunteerDispatchRequest[] {
    return this.dispatches.filter(d => d.volunteerId === volunteerId);
  }

  public async updateDispatchStatus(
    dispatchId: string, 
    status: 'accepted' | 'declined' | 'completed'
  ): Promise<VolunteerDispatchRequest | null> {
    const index = this.dispatches.findIndex(d => d.id === dispatchId);
    if (index === -1) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('volunteer_dispatches')
          .update({ status })
          .eq('id', dispatchId);
      } catch (e) {}
    }

    this.dispatches[index] = {
      ...this.dispatches[index],
      status
    };

    if (status === 'completed' || status === 'accepted') {
      const volIndex = this.volunteers.findIndex(v => v.id === this.dispatches[index].volunteerId);
      if (volIndex !== -1 && status === 'completed') {
        this.volunteers[volIndex].totalAssistsCount += 1;
      }
    }

    this.saveState();
    return this.dispatches[index];
  }

  // ====================================================================
  // NOTIFICATIONS
  // ====================================================================

  public async getNotifications(userId: string): Promise<AppNotification[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: AppNotification[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            titleAr: row.title_ar,
            titleFr: row.title_fr,
            bodyAr: row.body_ar,
            bodyFr: row.body_fr,
            relatedReportId: row.related_report_id,
            relatedAdoptionId: row.related_adoption_id,
            isRead: Boolean(row.is_read),
            createdAt: row.created_at
          }));
          this.notifications = mapped;
          return mapped;
        }
      } catch (e) {}
    }

    return this.notifications.filter(n => n.userId === userId);
  }

  public async markNotificationRead(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {}
    }

    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveState();
    }
  }

  public async addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert({
          user_id: notif.userId,
          type: notif.type,
          title_ar: notif.titleAr,
          title_fr: notif.titleFr,
          body_ar: notif.bodyAr,
          body_fr: notif.bodyFr,
          related_report_id: notif.relatedReportId || null,
          related_adoption_id: notif.relatedAdoptionId || null,
          is_read: false
        });
      } catch (e) {}
    }

    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      isRead: false,
      createdAt: now
    };

    this.notifications.unshift(newNotif);
    this.saveState();
  }

  // Synchronous cached accessors
  public getAllReports(): AnimalReport[] {
    return [...this.reports];
  }

  public getAllAdoptions(): AdoptionListing[] {
    return [...this.adoptions];
  }

  public getAllApplications(): AdoptionApplication[] {
    return [...this.applications];
  }

  public getUserNotifications(userId: string): AppNotification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  public getAllDispatches(): any[] {
    return [...this.dispatches];
  }

  public getVolunteerById(volunteerId: string): VolunteerProfile | undefined {
    return this.volunteers.find(v => v.id === volunteerId);
  }

  public getVolunteerByUserId(userId: string): VolunteerProfile | undefined {
    return this.volunteers.find(v => v.userId === userId);
  }

  public async updateVolunteerProfile(volunteerId: string, updates: Partial<VolunteerProfile>): Promise<VolunteerProfile | null> {
    const idx = this.volunteers.findIndex(v => v.id === volunteerId);
    if (idx === -1) return null;
    this.volunteers[idx] = { ...this.volunteers[idx], ...updates };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('volunteer_profiles').update({
          full_name: updates.fullName,
          phone: updates.phone,
          city: updates.city,
          neighborhood: updates.neighborhood,
          roles: updates.roles,
          has_vehicle: updates.hasVehicle,
          vehicle_type: updates.vehicleType,
          availability: updates.availability
        }).eq('id', volunteerId);
      } catch (e) {}
    }
    this.saveState();
    return this.volunteers[idx];
  }

  public async updateAdoptionApplicationStatus(applicationId: string, status: any, notes?: string): Promise<boolean> {
    const idx = this.applications.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      this.applications[idx].status = status;
      this.saveState();
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('adoption_applications').update({ status }).eq('id', applicationId);
      } catch (e) {}
    }
    return true;
  }

  public async acceptResponsibility(reportId: string, responderId: string, notes?: string): Promise<AnimalReport | null> {
    const responder = this.responders.find(r => r.id === responderId) || {
      id: responderId,
      userId: responderId,
      responderType: 'association',
      verificationStatus: 'verified',
      name: 'جهة معتمدة',
      description: '',
      email: '',
      phone: '',
      governoratesServed: ['damascus'],
      citiesServed: ['دمشق'],
      servicesOffered: ['rescue'],
      availability: 'available',
      createdAt: new Date().toISOString()
    } as ResponderProfile;

    const res = await this.acceptReportResponsibility(reportId, responder, notes);
    if (res.success) {
      return this.reports.find(r => r.id === reportId) || null;
    }
    return null;
  }

  public async inviteCollaborator(reportId: string, responderId: string, role?: string, note?: string): Promise<boolean> {
    return true;
  }

  public async addReportUpdate(arg1: any, arg2?: any): Promise<boolean> {
    const reportId = typeof arg1 === 'string' ? arg1 : arg1?.reportId;
    const updateData = typeof arg1 === 'string' ? arg2 : arg1;
    const rep = this.reports.find(r => r.id === reportId);
    if (!rep) return false;
    const now = new Date().toISOString();
    const newUpdate: ReportUpdate = {
      id: `upd_${Date.now()}`,
      reportId,
      authorId: updateData?.authorId || '',
      authorName: updateData?.authorName || '',
      authorType: updateData?.authorType || updateData?.authorRole || 'association',
      title: updateData?.title || 'ملاحظة ومتابعة جديدة',
      content: updateData?.content || '',
      mediaUrls: updateData?.mediaUrls || updateData?.photos || [],
      isPublic: updateData?.isPublic ?? true,
      createdAt: now
    };
    if (!rep.publicUpdates) rep.publicUpdates = [];
    rep.publicUpdates.push(newUpdate);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('report_updates').insert({
          report_id: reportId,
          author_id: updateData?.authorId,
          title: updateData?.title || 'تحديث على البلاغ',
          content: updateData?.content,
          is_public: updateData?.isPublic ?? true
        });
      } catch (e) {}
    }
    this.saveState();
    return true;
  }

  public async registerResponder(responderData: any): Promise<ResponderProfile> {
    const newResp: ResponderProfile = {
      id: `resp_${Date.now()}`,
      userId: responderData.userId || `user_${Date.now()}`,
      responderType: responderData.responderType || 'association',
      verificationStatus: responderData.responderType === 'association' ? 'verified' : 'pending',
      name: responderData.name || 'جهة معتمدة',
      description: responderData.description || '',
      email: responderData.email || '',
      phone: responderData.phone || '',
      governoratesServed: responderData.governoratesServed || ['damascus'],
      citiesServed: responderData.citiesServed || ['دمشق'],
      servicesOffered: responderData.servicesOffered || [],
      availability: 'available',
      createdAt: new Date().toISOString()
    };
    this.responders.push(newResp);
    this.saveState();
    return newResp;
  }

  public getPublicStats() {
    return {
      rescuesCount: this.reports.length,
      adoptionsCount: this.adoptions.length,
      volunteersCount: this.volunteers.length,
      governoratesCount: 14
    };
  }
}

export const dataService = new DataService();
