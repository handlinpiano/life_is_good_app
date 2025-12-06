import { createContext, useContext, useEffect, useState } from 'react';
import {
    supabase,
    isOnline,
    signIn as supabaseSignIn,
    signUp as supabaseSignUp,
    signOut as supabaseSignOut,
    getCurrentUser,
    getProfile,
    saveProfile,
    pullAllData,
    syncSeeds,
    syncLogs,
    syncWisdom,
    syncMessages,
    syncCheckins
} from '../utils/supabase';
import { db, setUserIdGetter } from '../utils/db';
import { useStore } from '../store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const setStoreUser = useStore(state => state.setUser);
    const setChart = useStore(state => state.setChart);

    useEffect(() => {
        // Set up the user ID getter for db.js sync
        setUserIdGetter(() => user?.id || null);
    }, [user]);

    useEffect(() => {
        // Check for existing session
        const initAuth = async () => {
            if (!isOnline()) {
                setLoading(false);
                return;
            }

            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                // Pull data from cloud on login
                await syncFromCloud(currentUser.id);
            }
            setLoading(false);
        };

        initAuth();

        // Listen for auth changes
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (event === 'SIGNED_IN' && session?.user) {
                        setUser(session.user);
                        await syncFromCloud(session.user.id);
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                    }
                }
            );

            return () => subscription.unsubscribe();
        }
    }, []);

    // Sync data FROM cloud to local
    const syncFromCloud = async (userId) => {
        if (!isOnline()) return;

        setSyncing(true);
        try {
            const cloudData = await pullAllData(userId);

            if (cloudData) {
                // Sync profile to store
                if (cloudData.profile) {
                    setStoreUser({
                        name: cloudData.profile.name,
                        birthDate: cloudData.profile.birth_date,
                        birthTime: cloudData.profile.birth_time,
                        birthPlace: cloudData.profile.birth_place,
                        latitude: cloudData.profile.latitude,
                        longitude: cloudData.profile.longitude
                    });
                    if (cloudData.profile.chart_data) {
                        setChart(cloudData.profile.chart_data);
                    }
                }

                // Sync seeds to Dexie
                if (cloudData.seeds?.length > 0) {
                    await db.seeds.clear();
                    const seedsForDexie = cloudData.seeds.map(s => ({
                        id: s.local_id,
                        title: s.title,
                        category: s.category,
                        description: s.description,
                        frequency: s.frequency,
                        difficulty: s.difficulty,
                        gurus_id: s.gurus_id,
                        created_at: new Date(s.created_at)
                    }));
                    await db.seeds.bulkPut(seedsForDexie);
                }

                // Sync logs
                if (cloudData.logs?.length > 0) {
                    await db.logs.clear();
                    const logsForDexie = cloudData.logs.map(l => ({
                        id: l.local_id,
                        seed_id: l.seed_id,
                        date: l.date,
                        status: l.status,
                        timestamp: new Date(l.timestamp)
                    }));
                    await db.logs.bulkPut(logsForDexie);
                }

                // Sync wisdom
                if (cloudData.wisdom?.length > 0) {
                    await db.wisdom.clear();
                    const wisdomForDexie = cloudData.wisdom.map(w => ({
                        id: w.local_id,
                        title: w.title,
                        category: w.category,
                        content: w.content,
                        guru_id: w.guru_id,
                        created_at: new Date(w.created_at)
                    }));
                    await db.wisdom.bulkPut(wisdomForDexie);
                }

                // Sync messages
                if (cloudData.messages?.length > 0) {
                    await db.messages.clear();
                    const messagesForDexie = cloudData.messages.map(m => ({
                        id: m.local_id,
                        guru_id: m.guru_id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.timestamp)
                    }));
                    await db.messages.bulkPut(messagesForDexie);
                }

                // Sync checkins
                if (cloudData.checkins?.length > 0) {
                    await db.checkins.clear();
                    const checkinsForDexie = cloudData.checkins.map(c => ({
                        id: c.local_id,
                        date: c.date,
                        panchang: c.panchang,
                        seeds_watered: c.seeds_watered,
                        seeds_total: c.seeds_total,
                        timestamp: new Date(c.timestamp)
                    }));
                    await db.checkins.bulkPut(checkinsForDexie);
                }
            }
        } catch (error) {
            console.error('Error syncing from cloud:', error);
        } finally {
            setSyncing(false);
        }
    };

    // Sync data TO cloud from local
    const syncToCloud = async () => {
        if (!isOnline() || !user) return;

        setSyncing(true);
        try {
            const storeState = useStore.getState();

            // Sync profile
            await saveProfile(user.id, {
                name: storeState.user?.name,
                birth_date: storeState.user?.birthDate,
                birth_time: storeState.user?.birthTime,
                birth_place: storeState.user?.birthPlace,
                latitude: storeState.user?.latitude,
                longitude: storeState.user?.longitude,
                chart_data: storeState.chart
            });

            // Sync all local data
            const [seeds, logs, wisdom, messages, checkins] = await Promise.all([
                db.seeds.toArray(),
                db.logs.toArray(),
                db.wisdom.toArray(),
                db.messages.toArray(),
                db.checkins.toArray()
            ]);

            await Promise.all([
                syncSeeds(user.id, seeds),
                syncLogs(user.id, logs),
                syncWisdom(user.id, wisdom),
                syncMessages(user.id, messages),
                syncCheckins(user.id, checkins)
            ]);

        } catch (error) {
            console.error('Error syncing to cloud:', error);
        } finally {
            setSyncing(false);
        }
    };

    const signIn = async (email, password) => {
        const result = await supabaseSignIn(email, password);
        if (!result.error && result.data?.user) {
            setUser(result.data.user);
            await syncFromCloud(result.data.user.id);
        }
        return result;
    };

    const signUp = async (email, password, name) => {
        const result = await supabaseSignUp(email, password, name);
        if (!result.error && result.data?.user) {
            // After signup, sync local data to cloud
            setUser(result.data.user);
            await syncToCloud();
        }
        return result;
    };

    const signOut = async () => {
        // Sync before signing out
        await syncToCloud();
        await supabaseSignOut();
        setUser(null);
    };

    const value = {
        user,
        loading,
        syncing,
        isOnline: isOnline(),
        signIn,
        signUp,
        signOut,
        syncToCloud,
        syncFromCloud: () => user && syncFromCloud(user.id)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
