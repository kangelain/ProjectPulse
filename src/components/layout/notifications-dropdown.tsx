
'use client';

import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import type { Notification } from '@/types/notification';
import { NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, X, AlertTriangle, Briefcase, CalendarClock, DollarSign, ShieldAlert, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react'; // Added missing import

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.DEADLINE_PROJECT:
    case NotificationType.DEADLINE_MILESTONE:
      return <CalendarClock className="h-4 w-4 text-blue-500" />;
    case NotificationType.BUDGET_OVERRUN:
      return <DollarSign className="h-4 w-4 text-orange-500" />;
    case NotificationType.PROJECT_AT_RISK:
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case NotificationType.PROJECT_DELAYED:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case NotificationType.PROJECT_HIGH_RISK_SCORE:
       return <ShieldAlert className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDismiss }: NotificationItemProps) {
  return (
    <div className={cn(
      "p-3 border-b border-border last:border-b-0 flex items-start gap-3 hover:bg-muted/50 transition-colors",
      notification.isRead && "opacity-70"
    )}>
      <div className="mt-1 shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-grow">
        <Link href={`/projects/${notification.projectId}`} className="hover:underline">
            <p className="text-sm font-medium text-foreground leading-tight">{notification.message}</p>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:bg-green-100 dark:hover:bg-green-800/50"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}


export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, clearAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!notifications) {
    return null; // Or a loading state
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 min-w-min justify-center rounded-full p-0.5 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 shadow-xl border-border" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Notifications</h3>
            {notifications.length > 0 && (
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={markAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No new notifications.</p>
            <p className="text-xs text-muted-foreground/70">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(min(60vh,400px))]"> {/* Max height */}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
              />
            ))}
          </ScrollArea>
        )}
        {notifications.length > 0 && (
            <div className="p-2 border-t border-border text-center">
                <Button variant="ghost" size="sm" className="text-xs w-full text-muted-foreground hover:text-destructive" onClick={clearAllNotifications}>
                    Clear All Notifications
                </Button>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

