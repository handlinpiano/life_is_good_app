import Dexie from 'dexie';

export const db = new Dexie('LifeGuruGarden');

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
}
