import { createContext, useContext, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useStore } from '../store';
import {
  clearTestAuthSession,
  getTestAuthSession,
  TEST_USER_DEFAULTS,
} from '../lib/testAuth';

const AuthContext = createContext(null);

/**
 * Auth + continuous profile hydrate.
 * Supports Clerk (default) and test-JWT backdoor (authMode === 'test').
 */
export function AuthProvider({ children, authMode = 'clerk' }) {
  const isTestMode = authMode === 'test';
  const testSession = isTestMode ? getTestAuthSession() : null;

  // Clerk hooks only valid under ClerkProvider — call them only in clerk mode
  // by splitting components.
  if (isTestMode) {
    return (
      <TestAuthProviderInner testSession={testSession}>
        {children}
      </TestAuthProviderInner>
    );
  }

  return <ClerkAuthProviderInner>{children}</ClerkAuthProviderInner>;
}

function useProfileHydrate(isAuthenticated) {
  const profile = useQuery(api.profiles.get, isAuthenticated ? {} : 'skip');
  const upsertProfile = useMutation(api.profiles.upsert);

  const setStoreUser = useStore((state) => state.setUser);
  const setChart = useStore((state) => state.setChart);
  const setDasha = useStore((state) => state.setDasha);
  const resetEverything = useStore((state) => state.resetEverything);
  const storeChart = useStore((state) => state.chart);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile === undefined) return;
    if (profile === null) return;

    setStoreUser({
      name: profile.name || '',
      gender: profile.gender || '',
      profession: profile.profession || '',
      relationshipStatus: profile.relationshipStatus || '',
      birthPlace: profile.birthPlace || null,
      birthData: profile.birthData || null,
    });

    if (profile.chartData) setChart(profile.chartData);
    if (profile.dashaData) setDasha(profile.dashaData);
  }, [isAuthenticated, profile, setStoreUser, setChart, setDasha]);

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

  return {
    profile,
    saveProfile,
    resetEverything,
    storeChart,
  };
}

function ClerkAuthProviderInner({ children }) {
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  const { profile, saveProfile, resetEverything, storeChart } =
    useProfileHydrate(isAuthenticated);

  const signOut = async () => {
    await clerkSignOut();
    resetEverything();
  };

  const loading = !clerkLoaded || convexLoading;
  const profileReady = !isAuthenticated || profile !== undefined;
  const hasChart = Boolean(profile?.chartData || storeChart);

  const value = {
    authMode: 'clerk',
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
    saveToCloud: saveProfile,
    syncToCloud: saveProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

function TestAuthProviderInner({ children, testSession }) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const { profile, saveProfile, resetEverything, storeChart } =
    useProfileHydrate(isAuthenticated);

  // Seed display name into store if profile empty
  useEffect(() => {
    if (!isAuthenticated || !testSession) return;
    if (profile) return;
    const state = useStore.getState();
    if (!state.user?.name) {
      useStore.getState().updateUser({ name: testSession.name || TEST_USER_DEFAULTS.name });
    }
  }, [isAuthenticated, testSession, profile]);

  const signOut = async () => {
    clearTestAuthSession();
    resetEverything();
    window.location.assign('/');
  };

  const loading = convexLoading;
  const profileReady = !isAuthenticated || profile !== undefined;
  const hasChart = Boolean(profile?.chartData || storeChart);

  const value = {
    authMode: 'test',
    user: isAuthenticated
      ? {
          id: testSession?.subject || TEST_USER_DEFAULTS.id,
          email: testSession?.email || TEST_USER_DEFAULTS.email,
          name: testSession?.name || TEST_USER_DEFAULTS.name,
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
