
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '@/types/notification';
import { generateAllNotifications } from '@/lib/notification-generator';
import { mockProjects } from '@/lib/mock-data'; // Assuming mockProjects can be imported

const LOCAL_STORAGE_KEY = 'projectPulseNotifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationContextType extends NotificationState {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load notifications from localStorage and generate new ones on initial mount
  useEffect(() => {
    let storedNotifications: Notification[] = [];
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        storedNotifications = JSON.parse(storedData);
        // Basic validation
        if (!Array.isArray(storedNotifications) || !storedNotifications.every(n => typeof n.id === 'string')) {
            storedNotifications = [];
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage", error);
      storedNotifications = [];
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    
    // Generate new notifications based on current project states
    // Pass existing (stored) notifications to avoid re-creating identical unread ones.
    const newGeneratedNotifications = generateAllNotifications(mockProjects, storedNotifications);

    // Combine new notifications with existing ones, avoiding duplicates by ID
    const combinedNotifications = [...storedNotifications];
    newGeneratedNotifications.forEach(newNotif => {
      if (!combinedNotifications.find(exNotif => exNotif.id === newNotif.id)) {
        combinedNotifications.push(newNotif);
      } else {
        // If it exists, update its message/date if it's a re-trigger of a read notification
        const existingIndex = combinedNotifications.findIndex(exNotif => exNotif.id === newNotif.id);
        if (existingIndex !== -1 && combinedNotifications[existingIndex].isRead) {
            combinedNotifications[existingIndex] = { ...newNotif, isRead: false }; // Re-activate as unread
        }
      }
    });
    
    // Sort by date, newest first
    combinedNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setNotifications(combinedNotifications);
    setIsLoaded(true);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) { // Only save after initial load and generation
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
            console.error("Failed to save notifications to localStorage", error);
        }
    }
  }, [notifications, isLoaded]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
  }), [notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, clearAllNotifications]);


  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
