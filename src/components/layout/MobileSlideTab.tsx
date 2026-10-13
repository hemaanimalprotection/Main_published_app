import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, Compass } from 'lucide-react';

interface MobileSlideTabProps {
  onOpen: () => void;
  unreadCount?: number;
}

export const MobileSlideTab: React.FC<MobileSlideTabProps> = ({ onOpen, unreadCount = 0 }) => {
  const { isRtl } = useLanguage();

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`md:hidden fixed top-[42%] z-30 flex items-center gap-1 py-2.5 px-2 bg-[#5B4D3F] text-white shadow-xl hover:bg-[#473C31] active:scale-95 transition-all duration-200 ${
        isRtl 
          ? 'right-0 rounded-l-2xl pr-2 pl-2.5 border-y border-l border-[#D4A373]/40' 
          : 'left-0 rounded-r-2xl pl-2 pr-2.5 border-y border-r border-[#D4A373]/40'
      }`}
      aria-label="سحب القائمة الرئيسية"
      title="القائمة السريعة"
    >
      <div className="flex flex-col items-center">
        <Menu className="w-4 h-4 text-[#D4A373]" />
        <span className="text-[9px] font-bold tracking-tight write-vertical mt-1 select-none" style={{ writingMode: 'vertical-rl' }}>
          القائمة
        </span>
      </div>
      {unreadCount > 0 && (
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse self-start" />
      )}
    </button>
  );
};
