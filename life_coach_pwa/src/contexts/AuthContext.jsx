import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useStore, setUserIdGetter } from '../store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerkAuth();
    const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

    const [syncing, setSyncing] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    // Convex queries and mutations - only run when authenticated
    const profile = useQuery(api.profiles.get, isAuthenticated ? {} : "skip");
    const cloudSeeds = useQuery(api.seeds.list, isAuthenticated ? {} : "skip");
    const cloudWisdom = useQuery(api.wisdom.list, isAuthenticated ? {} : "skip");
    const cloudMessages = useQuery(api.messages.list, isAuthenticated ? {} : "skip");
    const cloudCheckins = useQuery(api.checkins.list, isAuthenticated ? {} : "skip");

    const upsertProfile = useMutation(api.profiles.upsert);
    const syncSeeds = useMutation(api.seeds.syncAll);
    const syncWisdom = useMutation(api.wisdom.syncAll);
    const syncMessages = useMutation(api.messages.syncAll);
    const syncCheckins = useMutation(api.checkins.syncAll);

    // Get store actions
    const setStoreUser = useStore(state => state.setUser);
    const setChart = useStore(state => state.setChart);
    const setDasha = useStore(state => state.setDasha);
    const setSeeds = useStore(state => state.setSeeds);
    const setWisdom = useStore(state => state.setWisdom);
    const setMessages = useStore(state => state.setMessages);
    const setCheckins = useStore(state => state.setCheckins);
    const resetEverything = useStore(state => state.resetEverything);

    // Set up user ID getter for store sync
    useEffect(() => {
        setUserIdGetter(() => clerkUser?.id || null);
    }, [clerkUser]);

    // Load data from Convex into Zustand when profile loads
    useEffect(() => {
        if (!isAuthenticated || hasSynced) return;
        if (profile === undefined) return; // Still loading

        console.log('[Auth] Loading from Convex...');
        setHasSynced(true);

        if (profile) {
            // Load profile into store
            setStoreUser({
                name: profile.name,
                gender: profile.gender,
                profession: profile.profession,
                relationshipStatus: profile.relationshipStatus,
                birthPlace: profile.birthPlace,
                birthData: profile.birthData
            });

            if (profile.chartData) {
                setChart(profile.chartData);
            }

            if (profile.dashaData) {
                setDasha(profile.dashaData);
            }
        }

        // Load seeds
        if (cloudSeeds?.length > 0) {
            const seeds = cloudSeeds.map(s => ({
                id: s.localId,
                title: s.title,
                category: s.category,
                description: s.description,
                streak: s.streak,
                lastCompleted: s.lastCompleted,
                completedDates: s.completedDates,
                active: s.active,
                created_at: new Date(s._creationTime)
            }));
            setSeeds(seeds);
        }

        // Load wisdom
        if (cloudWisdom?.length > 0) {
            const wisdom = cloudWisdom.map(w => ({
                id: w.localId,
                title: w.title,
                category: w.category,
                content: w.content,
                guruId: w.guruId,
                favorite: w.favorite,
                created_at: new Date(w._creationTime)
            }));
            setWisdom(wisdom);
        }

        // Load messages
        if (cloudMessages?.length > 0) {
            const messages = cloudMessages.map(m => ({
                id: m.localId,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp)
            }));
            setMessages(messages);
        }

        // Load checkins
        if (cloudCheckins?.length > 0) {
            const checkins = cloudCheckins.map(c => ({
                id: c.localId,
                date: c.date,
                mood: c.mood,
                energy: c.energy,
                focus: c.focus,
                gratitude: c.gratitude,
                notes: c.notes,
                timestamp: new Date(c._creationTime)
            }));
            setCheckins(checkins);
        }

        console.log('[Auth] Data loaded from Convex');
    }, [isAuthenticated, profile, cloudSeeds, cloudWisdom, cloudMessages, cloudCheckins, hasSynced,
        setStoreUser, setChart, setDasha, setSeeds, setWisdom, setMessages, setCheckins]);

    // Save current Zustand state to Convex
    const saveToCloud = useCallback(async () => {
        if (!isAuthenticated) {
            console.warn('[Auth] saveToCloud: not authenticated');
            return { success: false };
        }

        setSyncing(true);
        try {
            const state = useStore.getState();
            console.log('[Auth] Saving to Convex...');

            // Save profile
            await upsertProfile({
                name: state.user?.name,
                gender: state.user?.gender,
                profession: state.user?.profession,
                relationshipStatus: state.user?.relationshipStatus,
                birthPlace: state.user?.birthPlace,
                birthData: state.user?.birthData,
                chartData: state.chart,
                dashaData: state.dasha
            });

            // Sync seeds
            if (state.seeds?.length > 0) {
                await syncSeeds({
                    seeds: state.seeds.map(s => ({
                        localId: s.id,
                        title: s.title,
                        category: s.category || '',
                        description: s.description || '',
                        streak: s.streak || 0,
                        lastCompleted: s.lastCompleted || null,
                        completedDates: s.completedDates || [],
                        active: s.active !== false
                    }))
                });
            }

            // Sync wisdom
            if (state.wisdom?.length > 0) {
                await syncWisdom({
                    items: state.wisdom.map(w => ({
                        localId: w.id,
                        title: w.title || '',
                        category: w.category || 'General',
                        content: w.content || '',
                        guruId: w.guruId,
                        favorite: w.favorite || false
                    }))
                });
            }

            // Sync messages
            if (state.messages?.length > 0) {
                await syncMessages({
                    items: state.messages.map(m => ({
                        localId: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp?.getTime() || Date.now()
                    }))
                });
            }

            // Sync checkins
            if (state.checkins?.length > 0) {
                await syncCheckins({
                    items: state.checkins.map(c => ({
                        localId: c.id,
                        date: c.date,
                        mood: c.mood,
                        energy: c.energy,
                        focus: c.focus,
                        gratitude: c.gratitude,
                        notes: c.notes
                    }))
                });
            }

            console.log('[Auth] Save successful');
            return { success: true };

        } catch (error) {
            console.error('[Auth] Error saving to Convex:', error);
            return { success: false, error };
        } finally {
            setSyncing(false);
        }
    }, [isAuthenticated, upsertProfile, syncSeeds, syncWisdom, syncMessages, syncCheckins]);

    const signOut = async () => {
        console.log('[Auth] signOut called');
        await saveToCloud();
        await clerkSignOut();
        setHasSynced(false);
        resetEverything();
    };

    const loading = !clerkLoaded || convexLoading;

    const value = {
        user: clerkUser ? {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: clerkUser.fullName || clerkUser.firstName
        } : null,
        loading,
        syncing,
        isOnline: true,
        isAuthenticated,
        signOut,
        saveToCloud,
        syncToCloud: saveToCloud,
        refreshFromCloud: () => {
            setHasSynced(false);
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
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
