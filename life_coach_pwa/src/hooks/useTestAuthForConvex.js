import { useCallback, useEffect, useState } from 'react';
import {
  getTestAuthSession,
  isTestAuthActive,
  refreshTestToken,
} from '../lib/testAuth';

/**
 * Auth adapter for ConvexProviderWithAuth in test-backdoor mode.
 * Shape matches what Convex expects from useAuth().
 */
export function useTestAuthForConvex() {
  const [token, setToken] = useState(() => getTestAuthSession()?.token || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isTestAuthActive()) {
        if (!cancelled) {
          setToken(null);
          setIsLoading(false);
        }
        return;
      }
      // Proactively refresh so Convex gets a valid JWT
      const fresh = await refreshTestToken();
      if (!cancelled) {
        setToken(fresh);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken } = {}) => {
      if (!isTestAuthActive()) return null;
      if (forceRefreshToken) {
        const fresh = await refreshTestToken();
        setToken(fresh);
        return fresh;
      }
      const session = getTestAuthSession();
      return session?.token || token;
    },
    [token]
  );

  return {
    isLoading,
    isAuthenticated: Boolean(token),
    fetchAccessToken,
  };
}
