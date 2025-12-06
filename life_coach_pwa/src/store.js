import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateChart, calculateDasha, calculateSynastry } from './utils/api';

export const useStore = create(
    persist(
        (set, get) => ({
            // --- User Profile Slice ---
            user: {
                name: '',
                gender: '',
                relationshipStatus: '',
                profession: '',
                sexualOrientation: '',
                birthData: null,
            },

            // Updates partial user data
            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),

            // --- Selected Gurus Slice ---
            selectedGurus: [],
            completedIntakes: [], // Track which gurus have completed intake

            setSelectedGurus: (gurus) => set({ selectedGurus: gurus }),

            markIntakeComplete: (guruId) => set((state) => ({
                completedIntakes: state.completedIntakes.includes(guruId)
                    ? state.completedIntakes
                    : [...state.completedIntakes, guruId]
            })),

            isIntakeComplete: (guruId) => get().completedIntakes.includes(guruId),

            getNextIncompleteGuru: () => {
                const { selectedGurus, completedIntakes } = get();
                return selectedGurus.find(id => !completedIntakes.includes(id)) || null;
            },

            // --- Astrology Slice ---
            chart: null,
            dasha: null,
            loading: false,
            error: null,

            calculateBirthChart: async (birthData) => {
                set({ loading: true, error: null });
                try {
                    const [chartResult, dashaResult] = await Promise.all([
                        calculateChart(birthData),
                        calculateDasha(birthData),
                    ]);

                    set((state) => ({
                        chart: chartResult,
                        dasha: dashaResult,
                        loading: false,
                        user: { ...state.user, birthData } // Confirm birthData is saved to user
                    }));
                    return true;
                } catch (err) {
                    set({ error: err.message || 'Failed to calculate chart', loading: false });
                    return false;
                }
            },

            // --- Compatibility Slice ---
            partner: null,
            synastry: null,

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
                        { label: 'Partner', birth_data: partnerBirthData }
                    ];

                    const result = await calculateSynastry(people);

                    if (result.success) {
                        set({
                            synastry: result,
                            partner: partnerBirthData,
                            loading: false
                        });
                        return true;
                    } else {
                        set({ error: result.error || 'Failed to calculate compatibility', loading: false });
                        return false;
                    }
                } catch (err) {
                    set({ error: err.message || 'Failed to calculate compatibility', loading: false });
                    return false;
                }
            },

            // --- Reset ---
            resetEverything: () => set({
                user: {
                    name: '',
                    gender: '',
                    relationshipStatus: '',
                    profession: '',
                    sexualOrientation: '',
                    birthData: null,
                },
                chart: null,
                dasha: null,
                partner: null,
                synastry: null,
                selectedGurus: [],
                completedIntakes: [],
                error: null
            })
        }),
        {
            name: 'vedicas-storage',
            partialize: (state) => ({
                user: state.user,
                chart: state.chart,
                dasha: state.dasha,
                partner: state.partner,
                synastry: state.synastry,
                selectedGurus: state.selectedGurus,
                completedIntakes: state.completedIntakes
            }),
        }
    )
);
