"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "../actions/logout";

// 2 hours in milliseconds (2 * 60 * 60 * 1000 = 7,200,000 ms)
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const THROTTLE_UPDATE_MS = 15 * 1000; // Throttle last-activity writes to once every 15 seconds
const STORAGE_KEY = "nexora_last_activity";

export function InactivityTracker() {
  const router = useRouter();
  const lastRecordedTimeRef = React.useRef<number>(0);
  const isLoggingOutRef = React.useRef<boolean>(false);

  const handleLogoutDueToInactivity = React.useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      localStorage.removeItem(STORAGE_KEY);
      await logoutAction();
      router.push("/login?reason=inactivity");
      router.refresh();
    } catch {
      router.push("/login?reason=inactivity");
    }
  }, [router]);

  const recordActivity = React.useCallback(() => {
    const now = Date.now();
    // Only update storage if at least THROTTLE_UPDATE_MS has passed
    if (now - lastRecordedTimeRef.current >= THROTTLE_UPDATE_MS) {
      lastRecordedTimeRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
        // Also update cookie for server/middleware visibility
        document.cookie = `${STORAGE_KEY}=${now}; path=/; max-age=7200; SameSite=Lax`;
      } catch {
        // Storage might fail in private/incognito mode
      }
    }
  }, []);

  React.useEffect(() => {
    const now = Date.now();
    lastRecordedTimeRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
      document.cookie = `${STORAGE_KEY}=${now}; path=/; max-age=7200; SameSite=Lax`;
    } catch {
      // Ignored
    }

    // Active interaction event listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const handler = () => recordActivity();

    events.forEach((evt) => {
      window.addEventListener(evt, handler, { passive: true });
    });

    // Periodic check for 2-hour inactivity
    const intervalId = setInterval(() => {
      let lastActivity = lastRecordedTimeRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > 0) {
            lastActivity = Math.max(lastActivity, parsed);
          }
        }
      } catch {
        // Fallback to in-memory ref
      }

      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        handleLogoutDueToInactivity();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handler);
      });
      clearInterval(intervalId);
    };
  }, [recordActivity, handleLogoutDueToInactivity]);

  return null;
}
