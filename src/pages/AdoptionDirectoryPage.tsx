import React, { useState, useMemo } from 'react';
import { AdoptionListing, AnimalType, SYRIAN_GOVERNORATES } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle,
  X
} from 'lucide-react';

interface AdoptionDirectoryPageProps {
  adoptions: AdoptionListing[];
  onSelectListing: (listingId: string) => void;
  onOpenPublish: () => void;
  onOpenAuth: () => void;
}

export const AdoptionDirectoryPage: React.FC<AdoptionDirectoryPageProps> = ({
  adoptions,
  onSelectListing,
  onOpenPublish,
  onOpenAuth
}) => {
  const { t, isRtl } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [onlyVaccinated, setOnlyVaccinated] = useState(false);
  const [onlyNeutered, setOnlyNeutered] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filter logic
  const filteredListings = useMemo(() => {
    return adoptions.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchDesc) return false;
      }

      if (selectedAnimalType !== 'all' && item.animalType !== selectedAnimalType) return false;
      if (selectedGovernorate !== 'all' && item.governorate !== selectedGovernorate) return false;
      if (selectedSex !== 'all' && item.sex !== selectedSex) return false;
      if (selectedAge !== 'all' && item.ageGroup !== selectedAge) return false;
      if (onlyVaccinated && !item.isVaccinated) return false;
      if (onlyNeutered && !item.isNeutered) return false;
      if (onlyUrgent && !item.isUrgent) return false;

      return true;
    });
  }, [
    adoptions,
    searchQuery,
    selectedAnimalType,
    selectedGovernorate,
    selectedSex,
    selectedAge,
    onlyVaccinated,
    onlyNeutered,
    onlyUrgent
  ]);

  const handlePublishClick = () => {
    if (!isAuthenticated) {
      onOpenAuth();
    } else {
      onOpenPublish();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-[#5B4D3F] text-white rounded-2xl p-5 sm:p-8 shadow-md border border-[#6E5E4E] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F5F2ED] text-xs font-bold border border-white/20">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>سجل التبني والإنقاذ الأخلاقي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.adoptionTitle}</h1>
          <p className="text-xs sm:text-sm text-[#E5E1D8] max-w-xl leading-relaxed">
            {t.adoptionSubtitle}
          </p>
        </div>

        <button
          onClick={handlePublishClick}
          className="px-5 py-3 rounded-xl bg-[#D4A373] hover:bg-[#C28E5A] text-white font-bold text-xs shadow-md shadow-[#D4A373]/30 transition transform active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{t.btnPublishAdoption}</span>
        </button>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FDFCF9] text-[#2D2D2D] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
            />
            <Search className="w-4 h-4 text-[#A0988E] absolute right-3.5 top-3" />
          </div>

          {/* Quick Animal Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'cat', label: '🐱 قطط' },
              { id: 'dog', label: '🐕 كلاب' },
              { id: 'bird', label: '🕊️ طيور' },
              { id: 'other', label: '🐾 أخرى' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedAnimalType(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedAnimalType === tab.id
                    ? 'bg-[#5B4D3F] text-white shadow-xs'
                    : 'bg-[#F5F2ED] text-[#7A7167] hover:bg-[#E5E1D8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Drawer Toggle */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              filterDrawerOpen || onlyVaccinated || onlyNeutered || onlyUrgent || selectedGovernorate !== 'all'
                ? 'bg-[#F5F2ED] border-[#D4A373] text-[#5B4D3F]'
                : 'border-[#E5E1D8] text-[#7A7167] hover:bg-[#F9F7F2]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة متقدمة</span>
          </button>
        </div>

        {/* Extended Filter Options Drawer */}
        {filterDrawerOpen && (
          <div className="pt-4 border-t border-[#F5F2ED] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">{t.filterGovernorate}</label>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
              >
                <option value="all">كافة المحافظات السورية</option>
                {SYRIAN_GOVERNORATES.map(g => (
                  <option key={g.id} value={g.id}>{g.nameAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">{t.filterSex}</label>
              <select
                value={selectedSex}
                onChange={(e) => setSelectedSex(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                <option value="all">الكل</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5B4D3F] mb-1">{t.filterAge}</label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-[#FDFCF9] text-[#2D2D2D]"
              >
                <option value="all">الكل</option>
                <option value="baby">رضيع / صغير</option>
                <option value="young">شاب (أقل من سنة)</option>
                <option value="adult">بالغ</option>
                <option value="senior">مسن</option>
              </select>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex flex-col justify-end space-y-1.5 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVaccinated}
                  onChange={(e) => setOnlyVaccinated(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>💉 {t.filterVaccinated}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyNeutered}
                  onChange={(e) => setOnlyNeutered(e.target.checked)}
                  className="rounded text-[#D4A373] focus:ring-[#D4A373]"
                />
                <span>✂️ {t.filterNeutered}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUrgent}
                  onChange={(e) => setOnlyUrgent(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-red-700 font-bold">🚨 {t.filterUrgent}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Grid Results */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E1D8] space-y-3">
          <Heart className="w-10 h-10 text-[#A0988E] mx-auto" />
          <h3 className="font-bold text-[#5B4D3F] text-base">{t.noData}</h3>
          <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
            جرب تعديل خيارات البحث أو الفلترة لعرض نتائج أكثر.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectListing(item.id)}
              className="group bg-white rounded-2xl border border-[#E5E1D8] overflow-hidden shadow-xs hover:border-[#D4A373] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
            >
              {/* Photo & Badges */}
              <div className="relative aspect-4/3 overflow-hidden bg-[#F5F2ED]">
                <img
                  src={item.photos[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-[#2D2D2D]/80 backdrop-blur-xs text-white text-[11px] font-bold">
                    📍 {item.city}
                  </span>
                  {item.isUrgent && (
                    <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                      عاجل
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  {item.isVaccinated && (
                    <span className="px-2 py-0.5 rounded-md bg-[#5B4D3F]/90 backdrop-blur-xs text-[#E5E1D8] text-[10px] font-semibold">
                      ✓ ملقح
                    </span>
                  )}
                  {item.isNeutered && (
                    <span className="px-2 py-0.5 rounded-md bg-[#5B4D3F]/90 backdrop-blur-xs text-[#E5E1D8] text-[10px] font-semibold">
                      ✓ معقم
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#5B4D3F]">{item.name}</h3>
                    <span className="text-xs text-[#7A7167] font-medium">{item.estimatedAge}</span>
                  </div>
                  <p className="text-xs text-[#7A7167] mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Compatibility Tags */}
                <div className="flex items-center gap-2 text-[11px] text-[#7A7167]">
                  {item.goodWithChildren && <span className="bg-[#F5F2ED] text-[#5B4D3F] px-2 py-0.5 rounded-md">👶 مناسب للأطفال</span>}
                  {item.goodWithCats && <span className="bg-[#F5F2ED] text-[#5B4D3F] px-2 py-0.5 rounded-md">🐱 لطيف مع القطط</span>}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#F5F2ED] flex items-center justify-between text-xs">
                  <span className="text-[#7A7167]">
                    بواسطة: <strong className="text-[#5B4D3F]">{item.publisherName}</strong>
                  </span>
                  <button className="text-[#D4A373] font-bold hover:underline">
                    عرض التفاصيل ←
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
