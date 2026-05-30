import React from 'react';
import { useNotificationStore } from '../../store/useNotificationStore.js';

export const NotificationContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm rounded-3xl border px-4 py-3 shadow-xl transition ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="font-semibold">{notification.type.toUpperCase()}</span>
            <p className="text-sm leading-6">{notification.message}</p>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="ml-auto text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
