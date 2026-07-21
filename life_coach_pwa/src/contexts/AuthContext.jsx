import { createContext, useContext, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useStore } from '../store';

const AuthContext = createContext(null);

/**
 * Auth + continuous profile hydrate.
 * Seeds / wisdom / messages / check-ins are NOT synced here — pages use Convex hooks.
 */
export function AuthProvider({ children }) {
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  const profile = useQuery(api.profiles.get, isAuthenticated ? {} : 'skip');
  const upsertProfile = useMutation(api.profiles.upsert);

  const setStoreUser = useStore((state) => state.setUser);
  const setChart = useStore((state) => state.setChart);
  const setDasha = useStore((state) => state.setDasha);
  const resetEverything = useStore((state) => state.resetEverything);
  const storeChart = useStore((state) => state.chart);

  // Continuously mirror Convex profile → Zustand (not a one-shot hydrate)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile === undefined) return; // still loading
    if (profile === null) return; // no profile yet (new user)

    setStoreUser({
      name: profile.name || '',
      gender: profile.gender || '',
      profession: profile.profession || '',
      relationshipStatus: profile.relationshipStatus || '',
      birthPlace: profile.birthPlace || null,
      birthData: profile.birthData || null,
    });

    if (profile.chartData) {
      setChart(profile.chartData);
    }
    if (profile.dashaData) {
      setDasha(profile.dashaData);
    }
  }, [isAuthenticated, profile, setStoreUser, setChart, setDasha]);

  /**
   * Persist current profile/chart/dasha from the store to Convex.
   * Used after intake (and anytime profile fields change intentionally).
   */
  const saveProfile = useCallback(
    async (overrides = {}) => {
      if (!isAuthenticated) {
        console.warn('[Auth] saveProfile: not authenticated');
        return { success: false, error: new Error('Not authenticated') };
      }

      try {
        const state = useStore.getState();
        await upsertProfile({
          name: overrides.name ?? state.user?.name,
          gender: overrides.gender ?? state.user?.gender,
          profession: overrides.profession ?? state.user?.profession,
          relationshipStatus:
            overrides.relationshipStatus ?? state.user?.relationshipStatus,
          birthPlace: overrides.birthPlace ?? state.user?.birthPlace,
          birthData: overrides.birthData ?? state.user?.birthData,
          chartData: overrides.chartData ?? state.chart,
          dashaData: overrides.dashaData ?? state.dasha,
        });
        return { success: true };
      } catch (error) {
        console.error('[Auth] Error saving profile:', error);
        return { success: false, error };
      }
    },
    [isAuthenticated, upsertProfile]
  );

  const signOut = async () => {
    await clerkSignOut();
    resetEverything();
  };

  const loading = !clerkLoaded || convexLoading;
  // Profile query settled when not authenticated, or when query returned null/object
  const profileReady = !isAuthenticated || profile !== undefined;
  const hasChart = Boolean(profile?.chartData || storeChart);

  const value = {
    user: clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName,
        }
      : null,
    loading,
    profileReady,
    profile,
    hasChart,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isAuthenticated,
    signOut,
    saveProfile,
    // Back-compat aliases used by Intake / older UI
    saveToCloud: saveProfile,
    syncToCloud: saveProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
