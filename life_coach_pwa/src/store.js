import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateChart, calculateDasha, calculateSynastry } from './utils/api';

/**
 * Local cache for profile + heavy chart payloads.
 * Seeds, wisdom, messages, and check-ins are Convex-only (useQuery/useMutation).
 * AuthContext mirrors profiles.get into this store for fast chart access in Chat.
 */
export const useStore = create(
  persist(
    (set, get) => ({
      // --- User Profile ---
      user: {
        name: '',
        gender: '',
        relationshipStatus: '',
        profession: '',
        sexualOrientation: '',
        birthPlace: null,
        birthData: null,
      },

      // --- Astrology ---
      chart: null,
      dasha: null,
      loading: false,
      error: null,

      // --- Compatibility (ephemeral session state) ---
      partner: null,
      synastry: null,

      // ============================================
      // SETTERS (used by AuthContext on profile load)
      // ============================================
      setUser: (userData) => set({ user: userData }),
      setChart: (chartData) => set({ chart: chartData }),
      setDasha: (dashaData) => set({ dasha: dashaData }),

      // ============================================
      // USER ACTIONS
      // ============================================
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      calculateBirthChart: async (birthParams) => {
        set({ loading: true, error: null });
        try {
          const [chartResult, dashaResult] = await Promise.all([
            calculateChart(birthParams),
            calculateDasha(birthParams),
          ]);

          set({
            chart: chartResult,
            dasha: dashaResult,
            loading: false,
          });
          return true;
        } catch (err) {
          set({
            error: err.message || 'Failed to calculate chart',
            loading: false,
          });
          return false;
        }
      },

      // ============================================
      // COMPATIBILITY
      // ============================================
      calculateCompatibility: async (partnerBirthData) => {
        const currentUser = get().user;
        if (!currentUser.birthData) {
          set({ error: 'User birth data missing' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          const people = [
            { label: 'You', birth_data: currentUser.birthData },
            { label: 'Partner', birth_data: partnerBirthData },
          ];

          const result = await calculateSynastry(people);

          if (result.success) {
            set({
              synastry: result,
              partner: partnerBirthData,
              loading: false,
            });
            return true;
          }

          set({
            error: result.error || 'Failed to calculate compatibility',
            loading: false,
          });
          return false;
        } catch (err) {
          set({
            error: err.message || 'Failed to calculate compatibility',
            loading: false,
          });
          return false;
        }
      },

      // ============================================
      // RESET
      // ============================================
      resetEverything: () =>
        set({
          user: {
            name: '',
            gender: '',
            relationshipStatus: '',
            profession: '',
            sexualOrientation: '',
            birthPlace: null,
            birthData: null,
          },
          chart: null,
          dasha: null,
          partner: null,
          synastry: null,
          error: null,
          loading: false,
        }),
    }),
    {
      name: 'vedicas-storage',
      // Only cache profile/chart locally — entities live in Convex
      partialize: (state) => ({
        user: state.user,
        chart: state.chart,
        dasha: state.dasha,
      }),
    }
  )
);

// Re-export constants so existing imports from '../store' keep working during transition
export {
  SEED_CATEGORIES,
  SEED_DIFFICULTIES,
  WISDOM_CATEGORIES,
} from './utils/constants';
