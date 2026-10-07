import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SYRIAN_GOVERNORATES } from '../../types';
import { User, Phone, MapPin, Globe, X, Check, Save } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, updateUserProfile } = useAuth();
  const { t, isRtl } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || 'damascus');
  const [city, setCity] = useState(user?.city || 'دمشق');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const [languagePreference, setLanguagePreference] = useState<'ar' | 'fr'>(user?.languagePreference || 'ar');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !user) return null;

  const currentGovObj = SYRIAN_GOVERNORATES.find(g => g.id === governorate) || SYRIAN_GOVERNORATES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSaving(true);
    await updateUserProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      governorate,
      city,
      neighborhood: neighborhood.trim(),
      languagePreference
    });
    setIsSaving(false);
    setSuccessMessage('تم تحديث بياناتك بنجاح');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-[#FDFCF9] to-[#F5F2ED] border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 border border-[#D4A373]/40 flex items-center justify-center text-[#5B4D3F]">
              <User className="w-5 h-5 text-[#5B4D3F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#5B4D3F]">تعديل الملف الشخصي</h2>
              <p className="text-[11px] text-[#7A7167]">تحديث معلومات التواصل والعنوان المعتمد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>الاسم الكامل</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] text-xs font-semibold text-[#2D2D2D] outline-hidden bg-[#FDFCF9]"
              placeholder="مثال: ياسمين الدمشقي"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>رقم الهاتف المعتمد</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] text-xs font-mono text-[#2D2D2D] outline-hidden bg-[#FDFCF9] text-right"
              placeholder="+963 9xx xxx xxx"
            />
          </div>

          {/* Governorate and City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>المحافظة</span>
              </label>
              <select
                value={governorate}
                onChange={(e) => {
                  const newGov = e.target.value;
                  setGovernorate(newGov);
                  const matched = SYRIAN_GOVERNORATES.find(g => g.id === newGov);
                  if (matched && matched.majorCities[0]) {
                    setCity(matched.majorCities[0].nameAr);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] focus:border-[#D4A373] text-xs font-semibold text-[#2D2D2D] outline-hidden bg-[#FDFCF9]"
              >
                {SYRIAN_GOVERNORATES.map(gov => (
                  <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5B4D3F]">
                <span>المدينة / المنطقة</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E1D8] focus:border-[#D4A373] text-xs font-semibold text-[#2D2D2D] outline-hidden bg-[#FDFCF9]"
              >
                {currentGovObj.majorCities.map(c => (
                  <option key={c.nameAr} value={c.nameAr}>{c.nameAr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Neighborhood */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5B4D3F]">
              <span>الحي أو الشارع السكني</span>
            </label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] text-xs font-semibold text-[#2D2D2D] outline-hidden bg-[#FDFCF9]"
              placeholder="مثال: المزة فيلات غربية، الصالحية..."
            />
          </div>

          {/* Language Preference */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-[#5B4D3F] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>لغة الواجهة المفضلة</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguagePreference('ar')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  languagePreference === 'ar'
                    ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                    : 'bg-[#FDFCF9] text-[#7A7167] border-[#E5E1D8] hover:bg-stone-50'
                }`}
              >
                <span>العربية (سورية)</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguagePreference('fr')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  languagePreference === 'fr'
                    ? 'bg-[#5B4D3F] text-white border-[#5B4D3F]'
                    : 'bg-[#FDFCF9] text-[#7A7167] border-[#E5E1D8] hover:bg-stone-50'
                }`}
              >
                <span>Français</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#F5F2ED]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-bold text-[#7A7167] hover:bg-stone-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving || !fullName.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
