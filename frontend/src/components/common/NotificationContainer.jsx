import React from 'react';
import { useNotificationStore } from '../../store/useNotificationStore.js';
import { Check, X, Info } from 'lucide-react';

export const NotificationContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  if (!notifications.length) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check className="text-accent-green" size={18} strokeWidth={2} />;
      case 'error':
        return <X className="text-accent-red" size={18} strokeWidth={2} />;
      default:
        return <Info className="text-text-secondary" size={18} strokeWidth={2} />;
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-full max-w-sm glass-card border-[var(--color-border)] rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-fade-up flex items-start gap-3`}
        >
          <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center border ${
             notification.type === 'success' ? 'bg-accent-green/10 border-accent-green/20' :
             notification.type === 'error' ? 'bg-accent-red/10 border-accent-red/20' :
             'bg-[var(--color-surface)] border-[var(--color-border-light)]'
          }`}>
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 pt-1 min-w-0">
             <p className="text-sm font-medium text-text-primary leading-tight">
               {notification.message}
             </p>
          </div>
          
          <button
            type="button"
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-[var(--color-surface)] transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
};
