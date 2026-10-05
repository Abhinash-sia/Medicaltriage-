'use client';

import { useEffect, useRef } from 'react';
import {
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isTokenExpiringSoon,
  refreshAccessToken,
  clearAuthSession,
} from '@/lib/authSession';

/**
 * Background silent token refresher component with Role-Differentiated Session Policies:
 *
 * 1. CLINICAL STAFF (Doctor, Nurse, Admin):
 *    - Continuous silent renewal while actively working (no sudden logouts during patient review).
 *    - 15-Minute Inactivity Protection: If staff ceases activity (no mouse/keyboard interaction)
 *      for >= 15 minutes, session is terminated and redirected to login.
 *    - Tab Close Protection: Refresh token resides in sessionStorage (destroyed on tab close).
 *      When opening the app later, credentials must be re-entered.
 *
 * 2. PATIENTS:
 *    - Low-friction experience: 7-day persistent login via localStorage.
 *    - Does not kick out patients on idle or tab closure.
 */
export function SilentTokenRefresher() {
  const isRefreshingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    // Activity listener to detect user engagement (throttled to once every 5 seconds)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 5000) {
        lastActivityRef.current = now;
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const checkAndRefresh = async () => {
      if (isRefreshingRef.current) return;

      const user = getStoredUser();
      const isStaff = user?.role && user.role !== 'PATIENT';
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // For staff: Enforce 15-minute idle timeout
      if (isStaff && accessToken) {
        const idleDurationMs = Date.now() - lastActivityRef.current;
        const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

        if (idleDurationMs >= FIFTEEN_MINUTES_MS) {
          // Staff stopped using the app for >15 minutes
          clearAuthSession(true);
          return;
        }

        // If staff closed tab previously, sessionStorage was wiped.
        // If remaining accessToken is expired and no refreshToken exists:
        if (!refreshToken && isTokenExpiringSoon(accessToken, 0)) {
          clearAuthSession(true);
          return;
        }
      }

      // If no refresh token is present, we cannot renew
      if (!refreshToken) return;

      // Proactively refresh if token is within 3 minutes of expiry
      if (isTokenExpiringSoon(accessToken, 180)) {
        try {
          isRefreshingRef.current = true;
          await refreshAccessToken();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    };

    // Check immediately on mount
    checkAndRefresh();

    // Check every 45 seconds
    const intervalId = setInterval(checkAndRefresh, 45 * 1000);

    // Check when user switches back to tab or wakes computer
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    const handleFocus = () => {
      checkAndRefresh();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}
