import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dataService } from './services/dataService';
import { AnimalReport, AdoptionListing, AdoptionApplication, AppNotification } from './types';
import { Lock, ShieldAlert, HeartHandshake, LogIn } from 'lucide-react';

// Layout & Modals
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthModal } from './components/modals/AuthModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { SqlViewerModal } from './components/modals/SqlViewerModal';

// Code-split / Lazy-loaded Pages for fast deployment & initial load
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const AdoptionDirectoryPage = lazy(() => import('./pages/AdoptionDirectoryPage').then(m => ({ default: m.AdoptionDirectoryPage })));
const AdoptionDetailsPage = lazy(() => import('./pages/AdoptionDetailsPage').then(m => ({ default: m.AdoptionDetailsPage })));
const PublishAdoptionPage = lazy(() => import('./pages/PublishAdoptionPage').then(m => ({ default: m.PublishAdoptionPage })));
const MyAdoptionsPage = lazy(() => import('./pages/MyAdoptionsPage').then(m => ({ default: m.MyAdoptionsPage })));
const CitizenReportWizardPage = lazy(() => import('./pages/CitizenReportWizardPage').then(m => ({ default: m.CitizenReportWizardPage })));
const ReportConfirmationPage = lazy(() => import('./pages/ReportConfirmationPage').then(m => ({ default: m.ReportConfirmationPage })));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage').then(m => ({ default: m.MyReportsPage })));
const ReportDetailsPage = lazy(() => import('./pages/ReportDetailsPage').then(m => ({ default: m.ReportDetailsPage })));
const OperationalWorkspacePage = lazy(() => import('./pages/OperationalWorkspacePage').then(m => ({ default: m.OperationalWorkspacePage })));
const ResponderPendingPage = lazy(() => import('./pages/ResponderPendingPage').then(m => ({ default: m.ResponderPendingPage })));
const PrivacyTermsPage = lazy(() => import('./pages/PrivacyTermsPage').then(m => ({ default: m.PrivacyTermsPage })));
const VolunteerDashboardPage = lazy(() => import('./pages/VolunteerDashboardPage').then(m => ({ default: m.VolunteerDashboardPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-[#D4A373] border-t-transparent animate-spin" />
      <span className="text-xs font-bold text-[#7A7167]">جاري تحميل الصفحة...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { isRtl } = useLanguage();
  const { 
    user, 
    responderProfile, 
    experience, 
    isAuthenticated, 
    isVerifiedResponder, 
    isPendingResponder, 
    isVolunteer,
    isAssociation 
  } = useAuth();

  // Navigation Routing State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedAdoptionId, setSelectedAdoptionId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [lastSubmittedRef, setLastSubmittedRef] = useState<string>('');
  const [lastSubmittedReportId, setLastSubmittedReportId] = useState<string>('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [authModalRegisterRole, setAuthModalRegisterRole] = useState<'citizen' | 'association' | 'veterinarian' | 'volunteer' | undefined>(undefined);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Application Data States
  const [reports, setReports] = useState<AnimalReport[]>([]);
  const [adoptions, setAdoptions] = useState<AdoptionListing[]>([]);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load and subscribe to real-time data
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setReports(dataService.getAllReports());
      setAdoptions(dataService.getAllAdoptions());
      setApplications(dataService.getAllApplications());
      if (user) {
        setNotifications(dataService.getUserNotifications(user.id));
      }
    });

    // Initial load
    setReports(dataService.getAllReports());
    setAdoptions(dataService.getAllAdoptions());
    setApplications(dataService.getAllApplications());
    if (user) {
      setNotifications(dataService.getUserNotifications(user.id));
    }

    return () => unsubscribe();
  }, [user]);

  // Navigate handler
  const handleNavigate = (view: string, param?: string) => {
    if (view === 'adoption_details' && param) {
      setSelectedAdoptionId(param);
    } else if (view === 'report_details' && param) {
      setSelectedReportId(param);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogin = () => {
    setAuthModalInitialView('login');
    setAuthModalRegisterRole(undefined);
    setAuthModalOpen(true);
  };

  const handleOpenRegister = (role?: 'citizen' | 'association' | 'veterinarian' | 'volunteer') => {
    setAuthModalInitialView('register');
    setAuthModalRegisterRole(role);
    setAuthModalOpen(true);
  };

  // Selected Entities
  const currentAdoption = adoptions.find(a => a.id === selectedAdoptionId) || adoptions[0];
  const currentReport = reports.find(r => r.id === selectedReportId) || reports[0];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF9] text-[#2D2D2D] font-sans selection:bg-[#D4A373]/30">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenLogin}
        onOpenVolunteerRegister={() => handleOpenRegister('volunteer')}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Slide-out Mobile Comprehensive Menu Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode === 'volunteer') {
            handleOpenRegister('volunteer');
          } else if (mode === 'responder') {
            handleOpenRegister('association');
          } else {
            handleOpenLogin();
          }
        }}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Routed Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentView === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              featuredAdoptions={adoptions}
              onOpenAuth={handleOpenLogin}
              onOpenVolunteerRegister={() => handleOpenRegister('volunteer')}
            />
          )}

          {currentView === 'adoptions' && (
            <AdoptionDirectoryPage
              adoptions={adoptions}
              onSelectListing={(id) => handleNavigate('adoption_details', id)}
              onOpenPublish={() => handleNavigate('publish_adoption')}
              onOpenAuth={handleOpenLogin}
            />
          )}

          {currentView === 'adoption_details' && currentAdoption && (
            <AdoptionDetailsPage
              listing={currentAdoption}
              onBack={() => handleNavigate('adoptions')}
              onOpenAuth={handleOpenLogin}
            />
          )}

          {currentView === 'publish_adoption' && (
            isAuthenticated ? (
              <PublishAdoptionPage
                onBack={() => handleNavigate('adoptions')}
                onSuccess={(newId) => handleNavigate('adoption_details', newId)}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E5E1D8] rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] mx-auto flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">تسجيل الدخول لنشر إعلان تبني</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  حفاظاً على سلامة ومتابعة الحيوانات وتوثيق الاتصال بالمتبنين، يرجى تسجيل الدخول أو إنشاء حسابك لنشر طلب التبني.
                </p>
                <button
                  onClick={handleOpenLogin}
                  className="w-full py-3 rounded-xl bg-[#5B4D3F] text-white font-bold text-xs hover:bg-[#4A3D30] transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            )
          )}

          {currentView === 'my_adoptions' && (
            isAuthenticated ? (
              <MyAdoptionsPage
                myListings={adoptions.filter(a => a.publisherId === user?.id)}
                applications={applications.filter(app => {
                  const myListingsIds = adoptions.filter(a => a.publisherId === user?.id).map(a => a.id);
                  return myListingsIds.includes(app.listingId) || app.applicantId === user?.id;
                })}
                onOpenPublish={() => handleNavigate('publish_adoption')}
                onSelectListing={(id) => handleNavigate('adoption_details', id)}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E5E1D8] rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] mx-auto flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">تسجيل الدخول لإدارة إعلانات التبني</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  يرجى تسجيل الدخول لإدارة إعلانات التبني المنشورة ومتابعة طلبات التبني الواردة والتواصل مع المتبنين.
                </p>
                <button
                  onClick={handleOpenLogin}
                  className="w-full py-3 rounded-xl bg-[#5B4D3F] text-white font-bold text-xs hover:bg-[#4A3D30] transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            )
          )}

          {currentView === 'report_wizard' && (
            <CitizenReportWizardPage
              onBack={() => handleNavigate('home')}
              onSuccess={(refNum, repId) => {
                setLastSubmittedRef(refNum);
                setLastSubmittedReportId(repId);
                handleNavigate('report_confirmation');
              }}
              onOpenAuth={handleOpenLogin}
            />
          )}

          {currentView === 'report_confirmation' && (
            <ReportConfirmationPage
              referenceNumber={lastSubmittedRef}
              reportId={lastSubmittedReportId}
              onNavigateToMyReports={() => handleNavigate('my_reports')}
              onNavigateToReportDetails={(id) => handleNavigate('report_details', id)}
              onNavigateHome={() => handleNavigate('home')}
            />
          )}

          {currentView === 'my_reports' && (
            isAuthenticated ? (
              <MyReportsPage
                reports={reports.filter(r => r.reporterId === user?.id)}
                onSelectReport={(id) => handleNavigate('report_details', id)}
                onOpenNewReport={() => handleNavigate('report_wizard')}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E5E1D8] rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F2ED] text-[#5B4D3F] mx-auto flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">تسجيل الدخول لمتابعة البلاغات</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  خصوصية البلاغات محمية. يرجى تسجيل الدخول برقم هاتفك لمشاهدة وتتبع حالة بلاغاتك الإسعافية السابقة.
                </p>
                <button
                  onClick={handleOpenLogin}
                  className="w-full py-3 rounded-xl bg-[#5B4D3F] text-white font-bold text-xs hover:bg-[#4A3D30] transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            )
          )}

          {currentView === 'report_details' && currentReport && (
            <ReportDetailsPage
              report={currentReport}
              onBack={() => handleNavigate(isVerifiedResponder ? 'operational_workspace' : 'my_reports')}
              onNavigateToWorkspace={() => handleNavigate('operational_workspace')}
            />
          )}

          {currentView === 'operational_workspace' && (
            (isVerifiedResponder || isAssociation) ? (
              <OperationalWorkspacePage
                reports={reports}
                onSelectReportId={(id) => handleNavigate('report_details', id)}
                onNavigate={handleNavigate}
              />
            ) : isPendingResponder ? (
              <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">طلب الاعتماد المهني قيد التدقيق</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  تم استلام طلبكم وهو قيد المراجعة والمطابقة الإدارية من قبل إدارة المنصة. سيتم فتح صلاحيات غرفة العمليات فور الاعتماد الرسمي.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleNavigate('responder_pending')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4A373] text-white font-bold text-xs hover:bg-[#C28E5A] transition"
                  >
                    عرض تفاصيل الطلب
                  </button>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] font-bold text-xs hover:bg-[#E5E1D8] transition"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-red-200 rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">منطقة مخصصة للكوادر المعتمدة</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  غرفة العمليات الوطنية وخريطة البلاغات المباشرة ودليل المتطوعين متاحة حصرياً للجمعيات الأهلية المرخصة والأطباء البيطريين المعتمدين حفاظاً على خصوصية المبلغين وسلامة الحيوانات.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleOpenLogin}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5B4D3F] text-white font-bold text-xs hover:bg-[#473C31] transition flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => handleOpenRegister('association')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4A373] text-white font-bold text-xs hover:bg-[#C28E5A] transition"
                  >
                    طلب اعتماد جهة أو طبيب
                  </button>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] font-bold text-xs hover:bg-[#E5E1D8] transition"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </div>
            )
          )}

          {currentView === 'volunteer_dashboard' && (
            isAuthenticated && isVolunteer ? (
              <VolunteerDashboardPage
                reports={reports}
                onNavigate={handleNavigate}
              />
            ) : (
              <div className="max-w-lg mx-auto my-16 p-8 bg-white border border-emerald-200 rounded-3xl text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#5B4D3F]">لوحة مهام شبكة المتطوعين</h2>
                <p className="text-xs text-[#7A7167] leading-relaxed">
                  لوحة المهام الميدانية واستقبال نداءات الاستجابة مخصصة للمتطوعين المسجلين في شبكة حِمى. انضم الآن للمساعدة في الإسعاف أو النقل أو الاستضافة المؤقتة.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleOpenLogin}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5B4D3F] text-white font-bold text-xs hover:bg-[#473C31] transition flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => handleOpenRegister('volunteer')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition"
                  >
                    انضم كمتطوع ميداني
                  </button>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] font-bold text-xs hover:bg-[#E5E1D8] transition"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </div>
            )
          )}

          {currentView === 'responder_pending' && (
            <ResponderPendingPage
              onBackToHome={() => handleNavigate('home')}
            />
          )}

          {(currentView === 'privacy' || currentView === 'terms') && (
            <PrivacyTermsPage
              onBack={() => handleNavigate('home')}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenSqlModal={() => setSqlModalOpen(true)}
      />

      {/* Mobile Bottom Navigation Bar (Fixed for high-accessibility 1-thumb operations) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMenu={() => setMobileDrawerOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialView={authModalInitialView}
        initialRegisterRole={authModalRegisterRole}
        onClose={() => setAuthModalOpen(false)}
        onSuccessRedirect={(role, isPending, accountType) => {
          if (currentView === 'report_wizard') {
            // Keep on wizard so emergency reporting is not interrupted
            return;
          }
          if (accountType === 'association' || role === 'responder') {
            if (accountType === 'association' || !isPending) {
              handleNavigate('operational_workspace');
            } else {
              handleNavigate('responder_pending');
            }
          } else if (role === 'volunteer') {
            handleNavigate('volunteer_dashboard');
          } else {
            handleNavigate('my_reports');
          }
        }}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => dataService.markNotificationRead(id)}
        onNavigateToReport={(id) => handleNavigate('report_details', id)}
      />

      <SqlViewerModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
