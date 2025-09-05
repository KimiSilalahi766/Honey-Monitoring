import { useEffect, useState, useRef } from 'react';
import { X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  className?: string;
}

export function NotificationSystem({ notifications, onClose, className }: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);
  
  // Auto-close notifications effect - proper implementation
  const scheduledTimers = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    notifications.forEach(notification => {
      if (notification.autoClose !== false && !scheduledTimers.current.has(notification.id)) {
        scheduledTimers.current.add(notification.id);
        const timeout = setTimeout(() => {
          scheduledTimers.current.delete(notification.id);
          onClose(notification.id);
        }, 5000);
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications.map(n => n.id).join(','), onClose]);

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          borderColor: 'border-destructive',
          iconColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          icon: AlertTriangle
        };
      case 'warning':
        return {
          borderColor: 'border-yellow-500',
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          icon: AlertTriangle
        };
      default:
        return {
          borderColor: 'border-primary',
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          icon: Info
        };
    }
  };

  const handleClose = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const notification = document.querySelector(`[data-notification-id="${id}"]`) as HTMLElement;
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        onClose(id);
      }, 300);
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div 
      className={cn(
        "fixed top-24 right-4 z-50 space-y-3 max-w-sm",
        className
      )}
      aria-live="polite"
    >
      {visibleNotifications.map((notification) => {
        const config = getNotificationConfig(notification.type);
        const IconComponent = config.icon;
        
        return (
          <div
            key={notification.id}
            data-notification-id={notification.id}
            className={cn(
              "notification-slide glass-card p-4 rounded-xl border-l-4 transition-all duration-300",
              "bg-card/60 backdrop-blur-lg border-border/50",
              config.borderColor,
              config.bgColor
            )}
            data-testid={`notification-${notification.type}`}
          >
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2 rounded-lg bg-gradient-to-br",
                config.iconColor,
                notification.type === 'danger' ? 'from-destructive/20 to-destructive/40' :
                notification.type === 'warning' ? 'from-yellow-500/20 to-orange-500/20' :
                'from-primary/20 to-primary/40'
              )}>
                <IconComponent className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn("font-semibold text-sm", config.iconColor)}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              <button
                onClick={(e) => handleClose(notification.id, e)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                data-testid={`button-close-notification-${notification.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: Notification['type'], 
    title: string, 
    message: string,
    autoClose: boolean = true
  ) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`, // More unique ID
      type,
      title,
      message,
      timestamp: new Date(),
      autoClose
    };
    
    // Check if similar notification already exists to prevent duplicates
    setNotifications(prev => {
      const exists = prev.some(n => n.title === title && n.message === message && n.type === type);
      if (exists) return prev;
      return [notification, ...prev.slice(0, 4)];
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};
