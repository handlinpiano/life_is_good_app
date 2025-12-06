import Dexie from 'dexie';

export const db = new Dexie('VedicasGarden');

// Version 1 (Implied base)
// Version 2: Added difficulty
db.version(2).stores({
    seeds: '++id, title, category, frequency, difficulty, created_at, gurus_id',
    logs: '++id, seed_id, date, status'
}).upgrade(tx => {
    // Migration: Set default difficulty for existing seeds
    return tx.table('seeds').toCollection().modify(seed => {
        seed.difficulty = 'Medium';
    });
});

// Version 3: Guru Memory (Messages)
db.version(3).stores({
    seeds: '++id, title, category, frequency, difficulty, created_at, gurus_id',
    logs: '++id, seed_id, date, status',
    messages: '++id, guru_id, role, content, timestamp'
});

// Version 4: Daily Check-ins for streaks and history
db.version(4).stores({
    seeds: '++id, title, category, frequency, difficulty, created_at, gurus_id',
    logs: '++id, seed_id, date, status',
    messages: '++id, guru_id, role, content, timestamp',
    checkins: '++id, &date, panchang, seeds_watered, seeds_total, timestamp'
});

export const SEED_CATEGORIES = {
    HEALTH: 'Health',
    SPIRITUAL: 'Spiritual',
    RELATIONSHIP: 'Relationship',
    CAREER: 'Career',
    GENERAL: 'General'
};

export const SEED_DIFFICULTIES = {
    Easy: { label: 'Easy', points: 10, color: 'bg-green-100 text-green-700' },
    Medium: { label: 'Medium', points: 20, color: 'bg-blue-100 text-blue-700' },
    Hard: { label: 'Hard', points: 30, color: 'bg-orange-100 text-orange-700' },
    Heroic: { label: 'Heroic', points: 50, color: 'bg-purple-100 text-purple-700' }
};

export const addSeed = async (title, category, description = '', difficulty = 'Medium', guruId = null) => {
    return await db.seeds.add({
        title,
        category,
        description,
        difficulty,
        gurus_id: guruId,
        frequency: 'daily',
        created_at: new Date()
    });
};

export const waterSeed = async (seedId, date_str) => {
    // Check if already watered
    const existing = await db.logs
        .where({ seed_id: seedId, date: date_str })
        .first();

    if (existing) return existing.id;

    return await db.logs.add({
        seed_id: seedId,
        date: date_str,
        status: 'completed',
        timestamp: new Date()
    });
};

export const getSeedLogs = async (seedId) => {
    return await db.logs.where('seed_id').equals(seedId).toArray();
};

export const getAllSeeds = async () => {
    return await db.seeds.toArray();
};

export const deleteSeed = async (id) => {
    await db.seeds.delete(id);
    // Also delete associated logs
    await db.logs.where('seed_id').equals(id).delete();
};

// ============================================
// DAILY CHECK-IN & STREAK FUNCTIONS
// ============================================

/**
 * Record a daily check-in with Panchang data
 */
export const recordCheckin = async (dateStr, panchang, seedsWatered, seedsTotal) => {
    const existing = await db.checkins.where('date').equals(dateStr).first();

    if (existing) {
        // Update existing check-in
        return await db.checkins.update(existing.id, {
            panchang,
            seeds_watered: seedsWatered,
            seeds_total: seedsTotal,
            timestamp: new Date()
        });
    }

    return await db.checkins.add({
        date: dateStr,
        panchang,
        seeds_watered: seedsWatered,
        seeds_total: seedsTotal,
        timestamp: new Date()
    });
};

/**
 * Get check-in for a specific date
 */
export const getCheckin = async (dateStr) => {
    return await db.checkins.where('date').equals(dateStr).first();
};

/**
 * Get all check-ins (for history view)
 */
export const getAllCheckins = async () => {
    return await db.checkins.orderBy('date').reverse().toArray();
};

/**
 * Calculate current streak (consecutive days with check-ins)
 */
export const calculateStreak = async () => {
    const checkins = await db.checkins.orderBy('date').reverse().toArray();

    if (checkins.length === 0) return { current: 0, longest: 0, total: 0 };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    // Check if streak is active (checked in today or yesterday)
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
                // Streak broken
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 1;
            }
        }
        lastDate = checkin.date;
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Current streak only counts if we've checked in today or yesterday
    if (hasRecentCheckin) {
        currentStreak = 0;
        lastDate = null;
        for (const checkin of checkins) {
            if (lastDate === null) {
                // First entry must be today or yesterday to count
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
};
