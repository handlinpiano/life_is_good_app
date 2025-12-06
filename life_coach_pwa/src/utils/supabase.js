import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Running in offline mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Check if we're connected to Supabase
export const isOnline = () => !!supabase;

// ============================================
// AUTH HELPERS (Simple email/password for family)
// ============================================

export const signUp = async (email, password, name) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });
    return { data, error };
};

export const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
};

export const signOut = async () => {
    if (!supabase) return { error: null };
    return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// PROFILE (User chart data, birth details)
// ============================================

export const saveProfile = async (userId, profileData) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            ...profileData,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    return { data, error };
};

export const getProfile = async (userId) => {
    if (!supabase) return { data: null, error: null };

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
};

// ============================================
// SEEDS (Habits)
// ============================================

export const syncSeeds = async (userId, seeds) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    // Upsert all seeds with user_id
    const seedsWithUser = seeds.map(seed => ({
        ...seed,
        user_id: userId,
        local_id: seed.id, // Keep local Dexie ID for reference
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('seeds')
        .upsert(seedsWithUser, { onConflict: 'user_id,local_id' })
        .select();

    return { data, error };
};

export const getSeeds = async (userId) => {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('seeds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const deleteSeedRemote = async (userId, localId) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const { error } = await supabase
        .from('seeds')
        .delete()
        .eq('user_id', userId)
        .eq('local_id', localId);

    return { error };
};

// ============================================
// SEED LOGS (Watering history)
// ============================================

export const syncLogs = async (userId, logs) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const logsWithUser = logs.map(log => ({
        ...log,
        user_id: userId,
        local_id: log.id,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('seed_logs')
        .upsert(logsWithUser, { onConflict: 'user_id,local_id' })
        .select();

    return { data, error };
};

export const getLogs = async (userId) => {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('seed_logs')
        .select('*')
        .eq('user_id', userId);

    return { data: data || [], error };
};

// ============================================
// WISDOM NOTES
// ============================================

export const syncWisdom = async (userId, wisdomNotes) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const wisdomWithUser = wisdomNotes.map(w => ({
        ...w,
        user_id: userId,
        local_id: w.id,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('wisdom')
        .upsert(wisdomWithUser, { onConflict: 'user_id,local_id' })
        .select();

    return { data, error };
};

export const getWisdom = async (userId) => {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('wisdom')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const deleteWisdomRemote = async (userId, localId) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const { error } = await supabase
        .from('wisdom')
        .delete()
        .eq('user_id', userId)
        .eq('local_id', localId);

    return { error };
};

// ============================================
// CHAT MESSAGES (Guru conversations)
// ============================================

export const syncMessages = async (userId, messages) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const messagesWithUser = messages.map(m => ({
        ...m,
        user_id: userId,
        local_id: m.id,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('messages')
        .upsert(messagesWithUser, { onConflict: 'user_id,local_id' })
        .select();

    return { data, error };
};

export const getMessages = async (userId, guruId = null) => {
    if (!supabase) return { data: [], error: null };

    let query = supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId);

    if (guruId) {
        query = query.eq('guru_id', guruId);
    }

    const { data, error } = await query.order('timestamp', { ascending: true });

    return { data: data || [], error };
};

// ============================================
// CHECK-INS (Daily streaks)
// ============================================

export const syncCheckins = async (userId, checkins) => {
    if (!supabase) return { error: { message: 'Offline mode' } };

    const checkinsWithUser = checkins.map(c => ({
        ...c,
        user_id: userId,
        local_id: c.id,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('checkins')
        .upsert(checkinsWithUser, { onConflict: 'user_id,date' })
        .select();

    return { data, error };
};

export const getCheckins = async (userId) => {
    if (!supabase) return { data: [], error: null };

    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    return { data: data || [], error };
};

// ============================================
// FULL SYNC (Pull all data from cloud)
// ============================================

export const pullAllData = async (userId) => {
    if (!supabase) return null;

    const [profile, seeds, logs, wisdom, messages, checkins] = await Promise.all([
        getProfile(userId),
        getSeeds(userId),
        getLogs(userId),
        getWisdom(userId),
        getMessages(userId),
        getCheckins(userId)
    ]);

    return {
        profile: profile.data,
        seeds: seeds.data,
        logs: logs.data,
        wisdom: wisdom.data,
        messages: messages.data,
        checkins: checkins.data
    };
};

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export const subscribeToChanges = (userId, table, callback) => {
    if (!supabase) return { unsubscribe: () => {} };

    const channel = supabase
        .channel(`${table}_changes_${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: table,
                filter: `user_id=eq.${userId}`
            },
            callback
        )
        .subscribe();

    return {
        unsubscribe: () => supabase.removeChannel(channel)
    };
};
