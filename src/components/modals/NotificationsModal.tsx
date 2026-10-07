import React from 'react';
import { AppNotification } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, Bell, CheckCheck, Clock, ShieldAlert, Heart, Info } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onNavigateToReport?: (reportId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onNavigateToReport
}) => {
  const { language, t, isRtl } = useLanguage();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    if (type.includes('urgent') || type.includes('report')) {
      return <ShieldAlert className="w-5 h-5 text-red-500" />;
    }
    if (type.includes('adoption')) {
      return <Heart className="w-5 h-5 text-rose-500" />;
    }
    return <Info className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{t.navNotifications}</h3>
              <p className="text-[11px] text-stone-500">{notifications.length} إشعار</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-stone-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">لا توجد إشعارات جديدة حالياً</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const title = language === 'ar' ? notif.titleAr : notif.titleFr;
              const body = language === 'ar' ? notif.bodyAr : notif.bodyFr;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkRead(notif.id);
                    if (notif.relatedReportId && onNavigateToReport) {
                      onNavigateToReport(notif.relatedReportId);
                      onClose();
                    }
                  }}
                  className={`py-3 px-2 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                    !notif.isRead ? 'bg-emerald-50/60 font-medium' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-xs border border-stone-200 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-stone-700 mt-1 leading-relaxed whitespace-pre-line">
                      {body}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-stone-100/60">
                      <div className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {notif.relatedReportId && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition">
                          عرض البلاغ والتنسيق الميداني ←
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
