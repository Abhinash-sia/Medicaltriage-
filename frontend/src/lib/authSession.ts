/**
 * Client-side Authentication & Silent Refresh Utilities
 * Manages access token, refresh token, expiry detection, and background renewal.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check sessionStorage (staff) first, then localStorage (patients)
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(data: {
  accessToken: string;
  refreshToken?: string;
  user?: any;
}): void {
  if (typeof window === 'undefined') return;

  const user = data.user || getStoredUser();
  const isStaff = user?.role && user.role !== 'PATIENT';

  if (isStaff) {
    // CLINICAL / STAFF POLICY:
    // Tab-scoped session: Refresh token is strictly in sessionStorage (erased on tab/browser close).
    // Ensure refreshToken is NEVER left in persistent localStorage for staff.
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    if (data.accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken); // mirrored for components reading localStorage
    }
    if (data.refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } else {
    // PATIENT POLICY:
    // Long-lived persistent session: Refresh token stored in localStorage (7-day validity).
    // Clean any old sessionStorage keys.
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    if (data.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
}

export function clearAuthSession(redirectToLogin = false): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (redirectToLogin && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login?expired=true';
  }
}

/**
 * Checks if a JWT access token is within threshold seconds of expiring.
 * Defaults to 180 seconds (3 minutes).
 */
export function isTokenExpiringSoon(token: string | null, thresholdSeconds = 180): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payloadBase64));
    if (!decoded.exp) return false;

    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const secondsRemaining = decoded.exp - currentTimeSeconds;
    return secondsRemaining <= thresholdSeconds;
  } catch {
    return true;
  }
}

// In-flight refresh lock to deduplicate concurrent refresh attempts
let inFlightRefreshPromise: Promise<string | null> | null = null;

/**
 * Silently exchanges the refresh token for a new access token.
 * Thread-safe / deduplicated: multiple parallel callers share the same promise.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // If refresh token itself expired or is invalid, clear session
        if (res.status === 401) {
          clearAuthSession(true);
        }
        return null;
      }

      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        setAuthSession(json.data);
        return json.data.accessToken;
      }

      return null;
    } catch {
      return null;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

/**
 * Drop-in authenticated fetch wrapper.
 * Automatically attaches Authorization header, and on 401 silently refreshes and retries.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = getAccessToken();

  // If token is close to expiry, proactively refresh before firing
  if (token && isTokenExpiringSoon(token, 60)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = refreshed;
    }
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  let response = await fetch(input, modifiedInit);

  // If 401 received, attempt silent refresh and replay once
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${refreshed}`,
        },
      };
      response = await fetch(input, retryInit);
    }
  }

  return response;
}
