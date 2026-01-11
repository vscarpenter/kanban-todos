"use client";

import { useEffect, useRef } from "react";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { notificationManager } from "@/lib/utils/notifications";

/**
 * NotificationProvider manages browser notifications for task due dates.
 * It respects the user's notification settings and requests permission when needed.
 */
export function NotificationProvider() {
  const { tasks } = useTaskStore();
  const { settings } = useSettingsStore();
  const permissionRequested = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // If notifications are disabled, stop any periodic checks
    if (!settings.enableNotifications) {
      notificationManager.stopPeriodicCheck();
      return;
    }

    // Track if component is still mounted to prevent race conditions
    let mounted = true;

    // Request permission once when notifications are enabled
    const initNotifications = async () => {
      if (!permissionRequested.current) {
        permissionRequested.current = true;
        const granted = await notificationManager.requestPermission();

        // Check if still mounted after async operation
        if (!mounted) return;

        if (!granted) {
          console.info("Notification permission not granted");
          return;
        }
      }

      // Only start periodic check if still mounted
      if (mounted) {
        notificationManager.stopPeriodicCheck(); // Clear any existing interval
        notificationManager.startPeriodicCheck(tasks);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      mounted = false;
      notificationManager.stopPeriodicCheck();
    };
  }, [settings.enableNotifications, tasks]);

  // This component doesn't render anything
  return null;
}
