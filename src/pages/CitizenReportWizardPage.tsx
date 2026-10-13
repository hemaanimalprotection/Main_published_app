import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { LocationPickerMap } from '../components/map/LocationPickerMap';
import { 
  AnimalType, 
  SituationType, 
  SeverityLevel, 
  SYRIAN_GOVERNORATES 
} from '../types';
import { 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Heart,
  Upload,
  Info,
  Trash2,
  Image as ImageIcon,
  Check,
  Plus,
  Eye
} from 'lucide-react';

interface UploadedImageItem {
  id: string;
  url: string;
  name: string;
  sizeKb?: number;
}

interface CitizenReportWizardPageProps {
  onBack: () => void;
  onSuccess: (reportRef: string, reportId: string) => void;
  onOpenAuth: () => void;
}

export const CitizenReportWizardPage: React.FC<CitizenReportWizardPageProps> = ({
  onBack,
  onSuccess,
  onOpenAuth
}) => {
  const { t, isRtl } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  // File input refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [situationType, setSituationType] = useState<SituationType>('injured');
  const [severity, setSeverity] = useState<SeverityLevel>('urgent');
  const [animalType, setAnimalType] = useState<AnimalType>('dog');
  const [animalCount, setAnimalCount] = useState(1);
  const [description, setDescription] = useState('');
  
  // Location
  const [governorate, setGovernorate] = useState(user?.governorate || 'damascus');
  const [city, setCity] = useState(user?.city || 'دمشق');
  const [neighborhood, setNeighborhood] = useState('الميدان - قرب جامع الماجد');
  const [landmark, setLandmark] = useState('مقابل الصيدلية المركزية');
  const [exactAddress, setExactAddress] = useState('دمشق - الميدان - قرب جامع الماجد، مقابل الصيدلية المركزية');
  const [isAddressAutoSynced, setIsAddressAutoSynced] = useState(true);
  const [lat, setLat] = useState(33.498);
  const [lng, setLng] = useState(36.295);

  // Media (Empty by default - no mock link)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Reporter Info
  const [reporterName, setReporterName] = useState(user?.fullName || 'أحمد الخطيب');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '0955123456');
  const [reporterAddress, setReporterAddress] = useState(user?.neighborhood ? `${user.neighborhood}، ${user.city}` : 'دمشق - الميدان، حي الحقلة');
  const [stayWithAnimal, setStayWithAnimal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Process & compress uploaded image file to data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPEG, PNG, WEBP).');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to max 1280px dimension to optimize upload and memory
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const newImageItem: UploadedImageItem = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: compressedDataUrl,
            name: file.name || 'photo.jpg',
            sizeKb: Math.round(compressedDataUrl.length / 1024)
          };

          setUploadedImages(prev => [...prev, newImageItem]);
          setErrorMessage(null);
        }
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessingImage(false);
      setErrorMessage('تعذر قراءة الصورة، يرجى المحاولة مرة أخرى.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files.item(i);
        if (file) {
          processImageFile(file);
        }
      }
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files.item(i);
        if (file) {
          processImageFile(file);
        }
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  // Step Nav validation
  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!situationType || !severity) {
        setErrorMessage('يرجى تحديد نوع الحالة ومستوى الاستعجال.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!description.trim()) {
        setErrorMessage('يرجى كتابة وصف تفصيلي لحالة الحيوان لمساعدة الطبيب والمسعف.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!city.trim() || !neighborhood.trim()) {
        setErrorMessage('يرجى تحديد المدينة والحي التقريبي.');
        return;
      }
      if (!exactAddress.trim()) {
        setExactAddress(`${city} - ${neighborhood}${landmark ? `، جانب ${landmark}` : ''}`);
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaList = uploadedImages.map((img, idx) => ({
        id: `med_${Date.now()}_${idx}`,
        reportId: '',
        mediaType: 'photo' as const,
        url: img.url,
        caption: `صورة توثيقية (${idx + 1})`,
        createdAt: new Date().toISOString()
      }));

      const finalAddress = exactAddress.trim() || `${city}، ${neighborhood}${landmark ? `، جانب ${landmark}` : ''}`;

      // Normalize situationType for database ('injury' -> 'injured', 'violence' -> 'abuse_violence')
      const resolvedSituationType = 
        situationType === 'injury' ? 'injured' : 
        situationType === 'violence' ? 'abuse_violence' : 
        situationType;

      const newReport = await dataService.createReport({
        reporterId: user?.id || 'usr_anonymous',
        animalType,
        situationType: resolvedSituationType,
        severity,
        governorate,
        city,
        neighborhood,
        approximateLocationDescription: finalAddress,
        description,
        isAggressiveOrScared: false,
        animalCount,
        stayWithAnimal,
        media: mediaList,
        lat,
        lng,
        exactAddress: finalAddress,
        landmark,
        reporterContactName: reporterName,
        reporterContactPhone: reporterPhone,
        reporterAddress: reporterAddress,
        accessNotes: 'يمكن الوصول بالسيارة بسهولة للمكان'
      }, {
        phone: reporterPhone,
        address: reporterAddress
      });

      setIsSubmitting(false);
      onSuccess(newReport.referenceNumber, newReport.id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال البلاغ.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Cancel Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4D3F] hover:text-[#2D2D2D] bg-[#F5F2ED] hover:bg-[#E5E1D8] px-3.5 py-2 rounded-xl transition border border-[#E5E1D8]"
      >
        <ArrowIcon className="w-4 h-4" />
        <span>إلغاء والعودة</span>
      </button>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-4 sm:p-8 space-y-6">
        {/* Wizard Header & Progress Bar */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#5B4D3F]">{t.wizardTitle}</h1>
                <p className="text-xs text-[#7A7167]">الخطوة {currentStep} من 5</p>
              </div>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              🚨 إسعاف سورية
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F5F2ED] h-2 rounded-full overflow-hidden border border-[#E5E1D8]">
            <div
              className="bg-[#D4A373] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SITUATION & SEVERITY */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-2">
                1. ما هو نوع الحالة الطارئة؟ *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'abuse_violence', label: 'عنف أو تعذيب', icon: '⚠️' },
                  { id: 'injured', label: 'إصابة أو كسر', icon: '🩹' },
                  { id: 'sick', label: 'مرض شديد', icon: '🩺' },
                  { id: 'abandoned', label: 'تخلي أو ولادة بالشارع', icon: '📦' },
                  { id: 'trapped', label: 'احتجاز أو سقوط في حفرة', icon: '🕳️' },
                  { id: 'homeless', label: 'تشرد وبحاجة مأوى', icon: '🏠' },
                ].map(item => {
                  const isSelected = situationType === item.id ||
                    (item.id === 'injured' && situationType === 'injury') ||
                    (item.id === 'abuse_violence' && situationType === 'violence') ||
                    (item.id === 'sick' && situationType === 'sickness') ||
                    (item.id === 'abandoned' && situationType === 'abandonment') ||
                    (item.id === 'trapped' && situationType === 'entrapment') ||
                    (item.id === 'homeless' && situationType === 'homelessness');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSituationType(item.id as SituationType)}
                      className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between gap-2 ${
                        isSelected 
                          ? 'border-[#D4A373] bg-[#FDFCF9] text-[#5B4D3F] ring-2 ring-[#D4A373]/30 font-bold' 
                          : 'border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] hover:bg-[#F5F2ED]'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-2">
                2. درجة الخطورة والاستعجال: *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'critical', title: 'حرج جداً (خطر موت فورى)', desc: 'نزيف حاد، دهس، غير قادر على الحركة', color: 'border-red-400 bg-red-50/70 text-red-900' },
                  { id: 'urgent', title: 'عاجل (بحاجة تدخل اليوم)', desc: 'كسر، تسمم، جروح متفرقة، ألم واضح', color: 'border-[#D4A373] bg-[#F9F7F2] text-[#5B4D3F]' },
                  { id: 'moderate', title: 'متوسط (خلال 24-48 ساعة)', desc: 'مشاكل جلدية، جراء بلا أم، هزال', color: 'border-[#E5E1D8] bg-[#FDFCF9] text-[#5B4D3F]' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSeverity(item.id as SeverityLevel)}
                    className={`p-3.5 rounded-xl border text-right transition ${
                      severity === item.id 
                        ? `${item.color} ring-2 ring-[#D4A373]/30 font-bold shadow-xs` 
                        : 'border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] hover:bg-[#F5F2ED]'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[11px] text-[#7A7167] mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ANIMAL DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-2">نوع الحيوان: *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cat', label: '🐱 قطة' },
                    { id: 'dog', label: '🐕 كلب' },
                    { id: 'horse_donkey', label: '🐎 خيل / حمار' },
                    { id: 'bird', label: '🕊️ طائر' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAnimalType(tab.id as AnimalType)}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-center ${
                        animalType === tab.id 
                          ? 'border-[#D4A373] bg-[#F5F2ED] text-[#5B4D3F] shadow-xs' 
                          : 'border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] hover:bg-[#F5F2ED]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-2">العدد التقريبي للحيوانات:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={animalCount}
                  onChange={(e) => setAnimalCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
                />
                <p className="text-[11px] text-[#7A7167] mt-1">حدد عددهم إذا كانت مجموعة جراء أو قطط حديثة الولادة.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-2">
                وصف الحالة ومظهر الحيوان: *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف شكل الإصابة، لون الحيوان، هل ينزف؟ هل يستطيع الوقوف؟ هل يشعر بالخوف؟..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
              />
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & MAP PINPOINT */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Interactive Leaflet Pinpoint */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
                  <span>تحديد النقطة على خريطة سورية:</span>
                  <span className="text-[11px] text-[#7A7167] font-normal">(انقر أو اسحب الدبوس)</span>
                </label>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                  🔄 المزامنة الفورية مفعلة
                </span>
              </div>

              <LocationPickerMap
                initialLat={lat}
                initialLng={lng}
                governorateId={governorate}
                onLocationChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
                onLocationSelectDetails={(details) => {
                  if (details.governorateId && details.governorateId !== governorate) {
                    setGovernorate(details.governorateId);
                  }
                  if (details.city) {
                    setCity(details.city);
                  }
                  if (details.neighborhood) {
                    setNeighborhood(details.neighborhood);
                  }
                  
                  // Compute written address from map point
                  const autoGeneratedAddr = details.exactAddress 
                    ? details.exactAddress + (landmark ? `، جانب ${landmark}` : '')
                    : `${details.city || city} - ${details.neighborhood || neighborhood}${landmark ? `، جانب ${landmark}` : ''}`;
                  
                  setExactAddress(autoGeneratedAddr);
                  setIsAddressAutoSynced(true);
                }}
              />
            </div>

            {/* LIVE SYNCHRONIZED WRITTEN ADDRESS BOX */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-[#5B4D3F]">
                  العنوان المكتوب التفصيلي للبلاغ (يتبع موقع الخريطة تلقائياً): *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const freshAddress = `${city} - ${neighborhood}${landmark ? `، جانب ${landmark}` : ''}`;
                    setExactAddress(freshAddress);
                    setIsAddressAutoSynced(true);
                  }}
                  className="text-[11px] text-[#D4A373] hover:text-[#5B4D3F] font-bold underline cursor-pointer shrink-0"
                >
                  إعادة توليد العنوان من الخريطة 🔄
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={exactAddress}
                  onChange={(e) => {
                    setExactAddress(e.target.value);
                    setIsAddressAutoSynced(false);
                  }}
                  placeholder="سيتم كتابة وتحديث العنوان المكتوب تلقائياً بمجرد اختيار المنطقة أو النقر على الخريطة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4A373]/60 bg-white text-xs font-semibold text-[#2D2D2D] focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#7A7167]">
                <span>
                  {isAddressAutoSynced ? (
                    <strong className="text-emerald-700 font-normal">✅ تم تحديث العنوان المكتوب تلقائياً حسب النقطة المختارة على الخريطة.</strong>
                  ) : (
                    <span className="text-[#D4A373]">✏️ تم تعديل العنوان المكتوب يدوياً. يمكنك النقر على إعادة التوليد لإعادة ربطه فورياً.</span>
                  )}
                </span>
                <span className="font-mono text-[#5B4D3F] text-[10px]">
                  ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              </div>
            </div>

            {/* BREAKDOWN ADDRESS FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المحافظة السورية: *</label>
                <select
                  value={governorate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGovernorate(val);
                    const selectedGov = SYRIAN_GOVERNORATES.find(g => g.id === val);
                    if (selectedGov) {
                      setCity(selectedGov.nameAr);
                      const newAddr = `${selectedGov.nameAr} - ${neighborhood}${landmark ? `، جانب ${landmark}` : ''}`;
                      setExactAddress(newAddr);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
                >
                  {SYRIAN_GOVERNORATES.map(g => (
                    <option key={g.id} value={g.id}>{g.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المدينة / المنطقة: *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCity(val);
                    setExactAddress(`${val} - ${neighborhood}${landmark ? `، جانب ${landmark}` : ''}`);
                  }}
                  placeholder="مثال: دمشق، اللاذقية، جرمانا، صحنايا"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">الحي أو الشارع: *</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNeighborhood(val);
                    setExactAddress(`${city} - ${val}${landmark ? `، جانب ${landmark}` : ''}`);
                  }}
                  placeholder="مثال: الميدان - جانب البريد القديم"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">معلم بارز لتسهيل الوصول:</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLandmark(val);
                    setExactAddress(`${city} - ${neighborhood}${val ? `، جانب ${val}` : ''}`);
                  }}
                  placeholder="مثال: قرب صيدلية النور، مقابل الحديقة العامة"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PHOTO & CAMERA UPLOAD (OPTIONAL) */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Hidden Native File Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-[#5B4D3F]">
                  توثيق الحالة بصرياً (صورة بالكاميرا أو رفع من الجهاز):
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  اختياري
                </span>
              </div>
              <p className="text-[11px] text-[#7A7167]">
                التقاط صورة للحيوان المصاب يساعد الفريق البيطري في تشخيص الإصابة وتجهيز الأدوية والمعدات المناسبة.
              </p>
            </div>

            {/* Quick Upload Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingImage}
                className="p-4 rounded-2xl bg-white border-2 border-[#D4A373] text-[#5B4D3F] hover:bg-[#FDFCF9] transition flex items-center justify-center gap-3 font-bold text-xs shadow-xs active:scale-98 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-[#D4A373]/15 text-[#D4A373] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#5B4D3F]">التقاط صورة بالكاميرا</div>
                  <div className="text-[10px] text-[#7A7167]">فتح كاميرا الهاتف فوراً</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessingImage}
                className="p-4 rounded-2xl bg-white border border-[#E5E1D8] text-[#5B4D3F] hover:bg-[#F5F2ED] transition flex items-center justify-center gap-3 font-bold text-xs shadow-xs active:scale-98 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-[#D4A373]" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#5B4D3F]">اختيار من المعرض / الملفات</div>
                  <div className="text-[10px] text-[#7A7167]">صور من الاستوديو أو الكمبيوتر</div>
                </div>
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => galleryInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-[#D4A373] bg-[#FDFCF9] scale-[1.01]'
                  : 'border-[#E5E1D8] bg-[#FDFCF9] hover:bg-[#F5F2ED]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#A0988E] mx-auto flex items-center justify-center mb-2">
                <ImageIcon className="w-5 h-5 text-[#D4A373]" />
              </div>
              <p className="text-xs font-bold text-[#5B4D3F] mb-1">
                اسحب الصور وأفلتها هنا، أو اضغط للتصفح
              </p>
              <p className="text-[11px] text-[#7A7167]">
                يدعم تنسيقات JPG, PNG, WEBP (يتم الضغط تلقائياً لتوفير باقة البيانات)
              </p>
            </div>

            {/* Processing Indicator */}
            {isProcessingImage && (
              <div className="p-3 bg-[#F5F2ED] rounded-xl text-center text-xs text-[#5B4D3F] flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
                <span>جاري معالجة وضغط الصورة بجودة عالية...</span>
              </div>
            )}

            {/* Uploaded Images Preview Grid */}
            {uploadedImages.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#5B4D3F]">
                  <span>الصور المرفقة بالبلاغ ({uploadedImages.length}):</span>
                  <span className="text-[11px] text-emerald-700 font-normal flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> جاهزة للإرسال
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-[#E5E1D8] bg-[#F5F2ED] shadow-xs aspect-4/3">
                      <img
                        src={img.url}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-2.5">
                        <span className="text-[10px] text-white font-mono bg-black/40 px-1.5 py-0.5 rounded-sm">
                          {img.sizeKb ? `${img.sizeKb} KB` : `#${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-sm"
                          title="حذف هذه الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Always visible delete badge on touch devices */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="sm:hidden absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional / Skip Notice */}
            {uploadedImages.length === 0 && (
              <div className="p-3.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] flex items-start gap-2.5 text-xs text-[#5B4D3F]">
                <Info className="w-4 h-4 text-[#D4A373] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">لا تملك صورة الآن؟</p>
                  <p className="text-[11px] text-[#7A7167] leading-relaxed">
                    لا تقلق، يمكنك الضغط مباشرة على <strong>"المتابعة للخطوة التالية"</strong> لإرسال البلاغ مع الوصف والموقع وسيتولى الفريق الميداني التحقق مباشرة.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & REPORTER CONTACT */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#5B4D3F]">
                <ShieldAlert className="w-4 h-4 text-[#D4A373]" />
                <span>حماية خصوصية بياناتك كمبلغ (Data Privacy Shield)</span>
              </div>
              <p className="text-[11px] text-[#7A7167] leading-relaxed">
                رقم هاتفك واسمك وإحداثياتك الدقيقة لن تظهر علناً في الخريطة العامة. فقط الجمعية أو الطبيب البيطري المعتمد الذي يقبل مسؤولية البلاغ رسمياً سيتمكن من رؤية بيانات الاتصال للتنسيق المباشر.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">اسم المبلّغ: *</label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B4D3F] mb-1">رقم هاتف المبلّغ: *</label>
                <input
                  type="tel"
                  required
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs font-mono text-[#2D2D2D]"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">عنوان سكن المبلّغ / موقع التواجد: *</label>
              <input
                type="text"
                required
                value={reporterAddress}
                onChange={(e) => setReporterAddress(e.target.value)}
                placeholder="مثال: دمشق - الميدان، حي الحقلة، جانب حديقة الميدان"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">يساعد الجمعية في معرفة عنوانك للتواصل الميداني أو في حال كنت تحتفظ بالحيوان عندك.</p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={stayWithAnimal}
                  onChange={(e) => setStayWithAnimal(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span className="font-bold">أنا متواجد بجانب الحيوان حالياً حتى وصول فريق الإنقاذ</span>
              </label>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-[#FDFCF9] border border-[#E5E1D8] text-xs space-y-2 text-[#5B4D3F]">
              <div className="font-bold text-[#5B4D3F] border-b border-[#E5E1D8] pb-1.5 flex items-center justify-between">
                <span>ملخص البلاغ الإسعافي:</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">جاهز للإرسال الفوري</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#7A7167]">
                <div className="sm:col-span-2">📍 العنوان المكتوب: <strong className="text-[#5B4D3F]">{exactAddress || `${neighborhood}، ${city}`}</strong></div>
                <div>🗺️ الإحداثيات: <strong className="text-[#5B4D3F] font-mono">{lat.toFixed(4)}, {lng.toFixed(4)}</strong></div>
                <div>🐾 النوع والعدد: <strong className="text-[#5B4D3F]">{animalType} ({animalCount})</strong></div>
                <div>🚨 درجة الخطورة: <strong className="text-red-600 font-bold">{severity}</strong></div>
                <div>📷 الصور التوثيقية: <strong className="text-[#5B4D3F]">{uploadedImages.length > 0 ? `${uploadedImages.length} صور تم إرفاقها` : 'بدون صورة (اختياري)'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Nav Buttons */}
        <div className="pt-4 border-t border-[#F5F2ED] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#5B4D3F] text-xs font-bold hover:bg-[#F5F2ED] transition flex items-center gap-1.5"
            >
              <ArrowIcon className="w-4 h-4" />
              <span>{t.btnPrev}</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#5B4D3F] hover:bg-[#473C31] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>{t.btnNext}</span>
              <NextIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitReport}
              className="px-6 py-3 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-md shadow-[#D4A373]/30 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? t.saving : t.btnSubmitReport}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
