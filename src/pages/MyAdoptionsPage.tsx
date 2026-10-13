import React, { useState } from 'react';
import { AdoptionListing, AdoptionApplication } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { 
  Heart, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Home, 
  Sparkles,
  Send,
  Inbox,
  Edit3
} from 'lucide-react';

interface MyAdoptionsPageProps {
  myListings: AdoptionListing[];
  applications: AdoptionApplication[];
  onOpenPublish: () => void;
  onSelectListing: (id: string) => void;
  onOpenEditProfile?: () => void;
}

export const MyAdoptionsPage: React.FC<MyAdoptionsPageProps> = ({
  myListings,
  applications,
  onOpenPublish,
  onSelectListing,
  onOpenEditProfile
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'received_applications' | 'sent_applications'>('listings');

  const handleUpdateStatus = async (appId: string, status: 'approved' | 'rejected') => {
    await dataService.updateAdoptionApplicationStatus(
      appId, 
      status, 
      status === 'approved' ? 'تمت الموافقة والتنسيق لاستلام الحيوان' : 'نعتذر لعدم تطابق شروط البيئة المناسبة'
    );
  };

  // Applications received for my listings
  const myListingsIds = myListings.map(a => a.id);
  const receivedApplications = applications.filter(app => myListingsIds.includes(app.listingId));

  // Applications I submitted as applicant
  const sentApplications = applications.filter(app => app.applicantId === user?.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#D4A373] fill-[#D4A373]" />
            <h1 className="text-2xl font-bold text-[#5B4D3F]">بوابة التبني والحيوانات الأليفة</h1>
          </div>
          <p className="text-xs text-[#7A7167] mt-1">
            إدارة إعلانات الحيوانات المعروضة للتبني ومتابعة طلبات التبني الواردة والمرسلة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenEditProfile && (
            <button
              onClick={onOpenEditProfile}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-white hover:bg-[#F5F2ED] text-[#5B4D3F] font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>تعديل الملف الشخصي</span>
            </button>
          )}

          <button
            onClick={onOpenPublish}
            className="px-4 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-md shadow-[#D4A373]/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.btnPublishAdoption}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E1D8] gap-2 overflow-x-auto">
        {/* Tab 1: Listings */}
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'listings' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>إعلاناتي المنشورة للتبني</span>
          <span className="px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#5B4D3F] text-[10px] font-bold border border-[#E5E1D8]">
            {myListings.length}
          </span>
        </button>

        {/* Tab 2: Received Applications */}
        <button
          onClick={() => setActiveTab('received_applications')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'received_applications' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-blue-600" />
          <span>طلبات التبني الواردة</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
            {receivedApplications.length}
          </span>
        </button>

        {/* Tab 3: Sent Applications */}
        <button
          onClick={() => setActiveTab('sent_applications')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sent_applications' ? 'border-[#D4A373] text-[#5B4D3F]' : 'border-transparent text-[#7A7167] hover:text-[#5B4D3F]'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>طلبات التبني التي قدمتها</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            {sentApplications.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LISTINGS */}
      {activeTab === 'listings' && (
        <div>
          {myListings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E1D8] space-y-3">
              <Heart className="w-12 h-12 text-[#A0988E] mx-auto opacity-50" />
              <h3 className="font-bold text-[#5B4D3F] text-sm">لم تنشر أي إعلان تبني بعد</h3>
              <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
                هل عثرت على حيوان بحاجة لعائلة محبة أو ترغب في إعادة توطين حيوان أليف بطريقة آمنة ومسؤولة؟
              </p>
              <button
                onClick={onOpenPublish}
                className="px-5 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>انشر أول إعلان تبني الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map(item => (
                <div
                  key={item.id}
                  onClick={() => onSelectListing(item.id)}
                  className="bg-white rounded-2xl border border-[#E5E1D8] overflow-hidden shadow-xs hover:border-[#D4A373] transition cursor-pointer flex flex-col group"
                >
                  <div className="aspect-4/3 relative overflow-hidden bg-[#F5F2ED]">
                    <img 
                      src={item.photos[0]} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#5B4D3F]/85 backdrop-blur-xs text-white text-[11px] font-bold">
                      📍 {item.city}
                    </span>
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xs ${
                      item.status === 'available' 
                        ? 'bg-emerald-500/90 text-white border-emerald-400' 
                        : 'bg-stone-800/90 text-white border-stone-600'
                    }`}>
                      {item.status === 'available' ? 'متاح للتبني' : 'تم التبني'}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-[#5B4D3F] text-base">{item.name}</h3>
                      <p className="text-xs text-[#7A7167] mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="pt-3 border-t border-[#F5F2ED] flex items-center justify-between text-xs text-[#7A7167]">
                      <span>نوع الحيوان: {item.animalType === 'cat' ? '🐈 قطة' : item.animalType === 'dog' ? '🐕 كلب' : '🐾 حيوان أليف'}</span>
                      <span className="text-[#D4A373] font-bold group-hover:underline">عرض التفاصيل ←</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECEIVED APPLICATIONS */}
      {activeTab === 'received_applications' && (
        <div className="space-y-4">
          {receivedApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E1D8] text-[#A0988E] text-xs space-y-2">
              <Inbox className="w-10 h-10 mx-auto text-[#A0988E] opacity-50" />
              <p className="font-bold text-[#5B4D3F]">لا توجد طلبات تبني واردة حتى الآن.</p>
              <p>ستظهر هنا أي طلبات تبني يقدمها المواطنون للحيوانات التي قمت بنشرها.</p>
            </div>
          ) : (
            receivedApplications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F5F2ED]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] border border-[#E5E1D8] font-bold flex items-center justify-center text-xs">
                      {app.applicantName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#5B4D3F]">{app.applicantName}</h3>
                      <p className="text-[11px] text-[#7A7167]">طلب تبني لـ: <strong className="text-[#5B4D3F]">{app.listingName}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      app.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : app.status === 'rejected' 
                          ? 'bg-red-50 text-red-800 border-red-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {app.status === 'approved' ? '✓ تمت الموافقة' : app.status === 'rejected' ? '✗ مرفوض' : '⏳ قيد المراجعة'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FDFCF9] p-3 rounded-xl border border-[#E5E1D8]">
                  <div className="flex items-center gap-1.5 text-[#5B4D3F]">
                    <Phone className="w-3.5 h-3.5 text-[#A0988E]" />
                    <span>الهاتف: <strong className="font-mono" dir="ltr">{app.applicantPhone}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#5B4D3F]">
                    <Home className="w-3.5 h-3.5 text-[#A0988E]" />
                    <span>نوع السكن: {app.housingType === 'apartment' ? 'شقة' : 'منزل مع حديقة'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#5B4D3F]">
                    <Sparkles className="w-3.5 h-3.5 text-[#A0988E]" />
                    <span>حيوانات سابقة: {app.hasOtherPets ? 'نعم' : 'لا'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#5B4D3F] mb-1">الدافع والبيئة المنزلية:</h4>
                  <p className="text-xs text-[#2D2D2D] leading-relaxed bg-[#FDFCF9] p-3 rounded-xl border border-[#E5E1D8]">
                    {app.motivation}
                  </p>
                </div>

                {app.status === 'submitted' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F5F2ED]">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition"
                    >
                      اعتذار ورفض
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'approved')}
                      className="px-4 py-1.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-xs transition"
                    >
                      قبول الطلب والتواصل
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SENT APPLICATIONS */}
      {activeTab === 'sent_applications' && (
        <div className="space-y-4">
          {sentApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E1D8] text-[#A0988E] text-xs space-y-2">
              <Send className="w-10 h-10 mx-auto text-[#A0988E] opacity-50" />
              <p className="font-bold text-[#5B4D3F]">لم تقدم أي طلب تبني بعد.</p>
              <p>تصفح الحيوانات المتاحة للتبني وقدم طلبك لعائلة محبة ومسؤولة.</p>
            </div>
          ) : (
            sentApplications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#F5F2ED]">
                  <div>
                    <h3 className="font-bold text-sm text-[#5B4D3F]">طلب تبني لـ: {app.listingName}</h3>
                    <p className="text-[11px] text-[#7A7167]">تاريخ التقديم: {new Date(app.createdAt).toLocaleDateString('ar-SY')}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    app.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : app.status === 'rejected' 
                        ? 'bg-red-50 text-red-800 border-red-200' 
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {app.status === 'approved' ? '✓ تمت الموافقة على طلبك' : app.status === 'rejected' ? '✗ تم الاعتذار' : '⏳ قيد مراجعة الناشر'}
                  </span>
                </div>

                <div className="text-xs text-[#5B4D3F] bg-[#FDFCF9] p-3 rounded-xl border border-[#E5E1D8] space-y-1.5">
                  <p><strong className="text-[#7A7167]">رسالتك ودوافع التبني:</strong> {app.motivation}</p>
                  {app.reviewNotes && (
                    <div className="pt-2 border-t border-[#E5E1D8]">
                      <strong className="text-[#D4A373]">ملاحظات الناشر: </strong>
                      <span className="text-[#2D2D2D]">{app.reviewNotes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={() => onSelectListing(app.listingId)}
                    className="text-xs text-[#D4A373] font-bold hover:underline"
                  >
                    عرض الملف التعريفي للحيوان ←
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
