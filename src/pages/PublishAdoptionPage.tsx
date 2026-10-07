import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { AnimalType, SYRIAN_GOVERNORATES } from '../types';
import { 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface PublishAdoptionPageProps {
  onBack: () => void;
  onSuccess: (newListingId: string) => void;
}

export const PublishAdoptionPage: React.FC<PublishAdoptionPageProps> = ({ onBack, onSuccess }) => {
  const { t, isRtl } = useLanguage();
  const { user } = useAuth();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  // Form State
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<AnimalType>('cat');
  const [breed, setBreed] = useState('');
  const [ageGroup, setAgeGroup] = useState<'baby' | 'young' | 'adult' | 'senior'>('young');
  const [estimatedAge, setEstimatedAge] = useState('حوالي 8 أشهر');
  const [sex, setSex] = useState<'male' | 'female' | 'unknown'>('male');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [governorate, setGovernorate] = useState(user?.governorate || 'damascus');
  const [city, setCity] = useState(user?.city || 'دمشق');
  const [description, setDescription] = useState('');
  const [healthCondition, setHealthCondition] = useState('سليم تماماً وتم فحصه طبياً');
  const [isVaccinated, setIsVaccinated] = useState(true);
  const [isNeutered, setIsNeutered] = useState(false);
  const [goodWithChildren, setGoodWithChildren] = useState(true);
  const [goodWithCats, setGoodWithCats] = useState(true);
  const [goodWithDogs, setGoodWithDogs] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !description.trim()) {
      setError('يرجى تعبئة كافة الحقول الإلزامية.');
      return;
    }

    setLoading(true);
    try {
      const created = await dataService.createAdoptionListing({
        publisherId: user.id,
        publisherRole: user.role === 'responder' ? 'responder' : 'citizen',
        publisherName: user.fullName,
        name,
        animalType,
        breed,
        estimatedAge,
        ageGroup,
        sex,
        size,
        governorate,
        city,
        description,
        healthCondition,
        isVaccinated,
        isNeutered,
        goodWithChildren,
        goodWithCats,
        goodWithDogs,
        isUrgent,
        status: 'published',
        personality: ['ودود', 'أليف', 'متعود على المنزل'],
        publishedAt: new Date().toISOString(),
        photos: [photoUrl]
      });

      setLoading(false);
      onSuccess(created.id);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'حدث خطأ أثناء حفظ الإعلان.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4D3F] hover:text-[#2D2D2D] bg-[#F5F2ED] hover:bg-[#E5E1D8] px-3.5 py-2 rounded-xl transition border border-[#E5E1D8]"
      >
        <ArrowIcon className="w-4 h-4" />
        <span>إلغاء والعودة</span>
      </button>

      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-4 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F5F2ED]">
          <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] text-[#5B4D3F] flex items-center justify-center border border-[#E5E1D8]">
            <Heart className="w-5 h-5 text-[#D4A373] fill-[#D4A373]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#5B4D3F]">نشر حيوان للتبني في سورية</h1>
            <p className="text-xs text-[#7A7167]">ساعد في إيجاد مأوى دائم وآمن للحيوان</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">اسم الحيوان أو لقبه *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: لوزة، بسبوس، روكي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D] focus:ring-2 focus:ring-[#D4A373]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">نوع الحيوان *</label>
              <select
                value={animalType}
                onChange={(e: any) => setAnimalType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                <option value="cat">قط (Cat)</option>
                <option value="dog">كلب (Dog)</option>
                <option value="bird">طائر (Bird)</option>
                <option value="horse_donkey">خيل / حمار</option>
                <option value="other">حيوان آخر</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">العمر التقريبي *</label>
              <input
                type="text"
                required
                value={estimatedAge}
                onChange={(e) => setEstimatedAge(e.target.value)}
                placeholder="مثال: سنة وشهرين"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">الجنس *</label>
              <select
                value={sex}
                onChange={(e: any) => setSex(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
                <option value="unknown">غير محدد</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">الحجم</label>
              <select
                value={size}
                onChange={(e: any) => setSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                <option value="small">صغير</option>
                <option value="medium">متوسط</option>
                <option value="large">كبير</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المحافظة *</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                {SYRIAN_GOVERNORATES.map(g => (
                  <option key={g.id} value={g.id}>{g.nameAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B4D3F] mb-1">المدينة / الحي *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: الشعلان، العزيزية، الوعر"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-bold text-[#5B4D3F] mb-1">رابط الصورة (Photo URL)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
                dir="ltr"
              />
            </div>
            {photoUrl && (
              <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-[#E5E1D8]">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>

          {/* Health & Personality Toggles */}
          <div className="p-4 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] space-y-3">
            <h4 className="text-xs font-bold text-[#5B4D3F]">الحالة الطبية والطباع:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVaccinated}
                  onChange={(e) => setIsVaccinated(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>💉 ملقح ومطعم</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNeutered}
                  onChange={(e) => setIsNeutered(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>✂️ معقم / مخصي</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={goodWithChildren}
                  onChange={(e) => setGoodWithChildren(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>👶 مناسب للأطفال</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={goodWithCats}
                  onChange={(e) => setGoodWithCats(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>🐱 متوافق مع القطط</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="text-red-700 font-bold">🚨 بحاجة مأوى عاجل</span>
              </label>
            </div>
          </div>

          {/* Description & Health Notes */}
          <div>
            <label className="block text-xs font-bold text-[#5B4D3F] mb-1">وصف الحيوان وقصته *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="صف شخصية الحيوان، قصة إنقاذه، وكيف يتفاعل مع البشر..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5B4D3F] mb-1">تفاصيل الفحص الطبي والرعاية</label>
            <input
              type="text"
              value={healthCondition}
              onChange={(e) => setHealthCondition(e.target.value)}
              placeholder="مثال: تم إعطاء جرعات الديدان، لا يعاني من أي أمراض معدية"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-xs text-[#2D2D2D]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-sm shadow-md shadow-[#D4A373]/30 transition disabled:opacity-50"
          >
            {loading ? t.saving : 'نشر إعلان التبني الآن'}
          </button>
        </form>
      </div>
    </div>
  );
};
