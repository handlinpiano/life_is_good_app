import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateChart, calculateDasha, calculateSynastry } from './utils/api';
import { getLocalDateString } from './utils/constants';

// Store the current user ID getter (set by AuthContext)
let _getCurrentUserId = () => null;
export const setUserIdGetter = (getter) => {
    _getCurrentUserId = getter;
};

// Simple Zustand store - persist enabled for offline support
// Sync to Convex is handled by AuthContext
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

            // --- Seeds (daily practices) ---
            seeds: [],
            logs: [], // watering logs

            // --- Wisdom Notes ---
            wisdom: [],

            // --- Chat Messages ---
            messages: [],

            // --- Check-ins ---
            checkins: [],

            // --- Compatibility ---
            partner: null,
            synastry: null,

            // ============================================
            // SETTERS (used by AuthContext on login)
            // ============================================
            setUser: (userData) => set({ user: userData }),
            setChart: (chartData) => set({ chart: chartData }),
            setDasha: (dashaData) => set({ dasha: dashaData }),
            setSeeds: (seeds) => set({ seeds }),
            setLogs: (logs) => set({ logs }),
            setWisdom: (wisdom) => set({ wisdom }),
            setMessages: (messages) => set({ messages }),
            setCheckins: (checkins) => set({ checkins }),

            // ============================================
            // USER ACTIONS
            // ============================================
            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
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
                        loading: false
                    });
                    return true;
                } catch (err) {
                    set({ error: err.message || 'Failed to calculate chart', loading: false });
                    return false;
                }
            },

            // ============================================
            // SEEDS
            // ============================================
            addSeed: (seedData) => {
                const newSeed = {
                    ...seedData,
                    id: String(Date.now()),
                    created_at: new Date()
                };
                set((state) => ({
                    seeds: [...state.seeds, newSeed]
                }));
            },

            deleteSeed: async (id) => {
                set((state) => ({
                    seeds: state.seeds.filter(s => s.id !== id),
                    logs: state.logs.filter(l => l.seed_id !== id)
                }));
            },

            waterSeed: (seedId, dateStr) => {
                const state = get();
                const exists = state.logs.some(l => l.seed_id === seedId && l.date === dateStr);
                if (exists) return;

                set((state) => ({
                    logs: [...state.logs, {
                        id: String(Date.now()),
                        seed_id: seedId,
                        date: dateStr,
                        status: 'completed',
                        timestamp: new Date()
                    }]
                }));
            },

            // ============================================
            // WISDOM
            // ============================================
            addWisdom: (noteData) => {
                const newNote = {
                    ...noteData,
                    id: String(Date.now()),
                    created_at: new Date()
                };
                set((state) => ({
                    wisdom: [...state.wisdom, newNote]
                }));
            },

            deleteWisdom: async (id) => {
                set((state) => ({
                    wisdom: state.wisdom.filter(w => w.id !== id)
                }));
            },

            // ============================================
            // MESSAGES
            // ============================================
            addMessage: (role, content) => {
                set((state) => ({
                    messages: [...state.messages, {
                        id: String(Date.now()),
                        role,
                        content,
                        timestamp: new Date()
                    }]
                }));
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            // ============================================
            // CHECK-INS
            // ============================================
            recordCheckin: (dateStr, panchang, seedsWatered, seedsTotal) => {
                set((state) => {
                    const existing = state.checkins.findIndex(c => c.date === dateStr);
                    const checkin = {
                        id: existing >= 0 ? state.checkins[existing].id : String(Date.now()),
                        date: dateStr,
                        panchang,
                        seeds_watered: seedsWatered,
                        seeds_total: seedsTotal,
                        timestamp: new Date()
                    };

                    if (existing >= 0) {
                        const updated = [...state.checkins];
                        updated[existing] = checkin;
                        return { checkins: updated };
                    }
                    return { checkins: [...state.checkins, checkin] };
                });
            },

            // Streak calculation
            calculateStreak: () => {
                const checkins = get().checkins.slice().sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );

                if (checkins.length === 0) return { current: 0, longest: 0, total: 0 };

                const today = getLocalDateString();
                const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

                let longestStreak = 0;
                let tempStreak = 0;
                let lastDate = null;

                const hasRecentCheckin = checkins.some(c => c.date === today || c.date === yesterday);

                for (const checkin of checkins) {
                    if (lastDate === null) {
                        tempStreak = 1;
                    } else {
                        const lastDateObj = new Date(lastDate);
                        const currentDateObj = new Date(checkin.date);
                        const diffDays = Math.round((lastDateObj - currentDateObj) / 86400000);

                        if (diffDays === 1) {
                            tempStreak++;
                        } else {
                            if (tempStreak > longestStreak) longestStreak = tempStreak;
                            tempStreak = 1;
                        }
                    }
                    lastDate = checkin.date;
                }

                if (tempStreak > longestStreak) longestStreak = tempStreak;

                let currentStreak = 0;
                if (hasRecentCheckin) {
                    lastDate = null;
                    for (const checkin of checkins) {
                        if (lastDate === null) {
                            if (checkin.date === today || checkin.date === yesterday) {
                                currentStreak = 1;
                                lastDate = checkin.date;
                            } else {
                                break;
                            }
                        } else {
                            const lastDateObj = new Date(lastDate);
                            const currentDateObj = new Date(checkin.date);
                            const diffDays = Math.round((lastDateObj - currentDateObj) / 86400000);

                            if (diffDays === 1) {
                                currentStreak++;
                                lastDate = checkin.date;
                            } else {
                                break;
                            }
                        }
                    }
                }

                return {
                    current: currentStreak,
                    longest: longestStreak,
                    total: checkins.length
                };
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

            // ============================================
            // RESET
            // ============================================
            resetEverything: () => set({
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
                seeds: [],
                logs: [],
                wisdom: [],
                messages: [],
                checkins: [],
                partner: null,
                synastry: null,
                error: null
            })
        }),
        {
            name: 'vedicas-storage',
            partialize: (state) => ({
                user: state.user,
                chart: state.chart,
                dasha: state.dasha,
                seeds: state.seeds,
                logs: state.logs,
                wisdom: state.wisdom,
                messages: state.messages,
                checkins: state.checkins,
            }),
        }
    )
);

// Helper constants
export const SEED_CATEGORIES = {
    HEALTH: 'Health',
    SPIRITUAL: 'Spiritual',
    RELATIONSHIP: 'Relationship',
    CAREER: 'Career',
    GENERAL: 'General'
};

export const SEED_DIFFICULTIES = {
    Tiny: { label: 'Tiny', points: 5, color: 'bg-slate-100 text-slate-700' },
    Easy: { label: 'Easy', points: 10, color: 'bg-green-100 text-green-700' },
    Light: { label: 'Light', points: 15, color: 'bg-teal-100 text-teal-700' },
    Medium: { label: 'Medium', points: 20, color: 'bg-blue-100 text-blue-700' },
    Moderate: { label: 'Moderate', points: 25, color: 'bg-cyan-100 text-cyan-700' },
    Challenging: { label: 'Challenging', points: 30, color: 'bg-orange-100 text-orange-700' },
    Hard: { label: 'Hard', points: 40, color: 'bg-red-100 text-red-700' },
    Heroic: { label: 'Heroic', points: 50, color: 'bg-purple-100 text-purple-700' }
};

export const WISDOM_CATEGORIES = {
    RECIPE: 'Recipe',
    PRACTICE: 'Practice',
    INSIGHT: 'Insight',
    MANTRA: 'Mantra',
    REMINDER: 'Reminder',
    GENERAL: 'General'
};
