
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
import { useState } from 'react';

// Keep icon colors for distinction, Asana uses subtle color cues too
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.DEADLINE_PROJECT:
    case NotificationType.DEADLINE_MILESTONE:
      return <CalendarClock className="h-3.5 w-3.5 text-blue-500" />; // Adjusted size
    case NotificationType.BUDGET_OVERRUN:
      return <DollarSign className="h-3.5 w-3.5 text-orange-500" />;
    case NotificationType.PROJECT_AT_RISK:
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    case NotificationType.PROJECT_DELAYED:
      return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    case NotificationType.PROJECT_HIGH_RISK_SCORE:
       return <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-gray-500" />;
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
      "p-2.5 border-b border-border last:border-b-0 flex items-start gap-2.5 hover:bg-muted/50 transition-colors", // Adjusted padding/gap
      notification.isRead && "opacity-60" // Dim read notifications slightly more
    )}>
      <div className="mt-0.5 shrink-0"> {/* Adjusted margin */}
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-grow">
        <Link href={`/projects/${notification.projectId}`} className="hover:underline">
            <p className="text-xs font-medium text-foreground leading-snug">{notification.message}</p> {/* Adjusted size/leading */}
        </Link>
        <p className="text-[10px] text-muted-foreground mt-0.5"> {/* Adjusted size */}
          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0"> {/* Adjusted gap */}
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-green-600 hover:bg-green-100 dark:hover:bg-green-800/50" // Adjusted size
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <CheckCheck className="h-3 w-3" /> {/* Adjusted size */}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive hover:bg-destructive/10" // Adjusted size
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
        >
          <X className="h-3 w-3" /> {/* Adjusted size */}
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
        <Button variant="ghost" size="icon" className="relative h-8 w-8"> {/* Adjusted size */}
          <Bell className="h-4 w-4" /> {/* Adjusted size */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 min-w-min justify-center rounded-full p-0 text-[9px]" // Adjusted size/pos/text
            >
              {unreadCount > 9 ? '9+' : unreadCount} {/* Cap at 9+ */}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      {/* Adjusted popover width */}
      <PopoverContent className="w-[340px] sm:w-[360px] p-0 shadow-xl border-border" align="end">
        <div className="p-2.5 border-b border-border"> {/* Adjusted padding */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3> {/* Adjusted size */}
            {notifications.length > 0 && (
              <Button variant="link" size="sm" className="text-xs h-auto p-0 text-muted-foreground hover:text-primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="p-5 text-center"> {/* Adjusted padding */}
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" /> {/* Adjusted size */}
            <p className="text-xs text-muted-foreground">No new notifications.</p> {/* Adjusted size */}
            <p className="text-[11px] text-muted-foreground/70">You're all caught up!</p> {/* Adjusted size */}
          </div>
        ) : (
          <ScrollArea className="h-[calc(min(60vh,350px))]"> {/* Adjusted max height */}
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
            <div className="p-1.5 border-t border-border text-center"> {/* Adjusted padding */}
                <Button variant="ghost" size="sm" className="text-xs w-full h-7 text-muted-foreground hover:text-destructive" onClick={clearAllNotifications}> {/* Adjusted size */}
                    Clear All Notifications
                </Button>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
