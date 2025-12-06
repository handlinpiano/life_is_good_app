import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addSeed, waterSeed, deleteSeed, SEED_DIFFICULTIES } from '../utils/db';
import { Droplets, Sprout, Plus, Trash2, CheckCircle, Leaf, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const CATEGORY_COLORS = {
    Health: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Spiritual: 'bg-violet-100 text-violet-800 border-violet-200',
    Relationship: 'bg-rose-100 text-rose-800 border-rose-200',
    Career: 'bg-blue-100 text-blue-800 border-blue-200',
    General: 'bg-amber-100 text-amber-800 border-amber-200'
};

function PlantSeedModal({ isOpen, onClose }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        await addSeed(title, category, description, difficulty);
        setTitle('');
        setDescription('');
        setDifficulty('Medium');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                    <Sprout size={24} className="text-green-600" /> Plant a New Seed
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Seed Name (Habit)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Morning Meditation"
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="Health">Health</option>
                                <option value="Spiritual">Spiritual</option>
                                <option value="Relationship">Relationship</option>
                                <option value="Career">Career</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                            >
                                {Object.keys(SEED_DIFFICULTIES).map(diff => (
                                    <option key={diff} value={diff}>{diff} ({SEED_DIFFICULTIES[diff].points} pts)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why are you planting this?"
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-stone-500 hover:text-stone-700 dark:text-stone-400">Cancel</button>
                        <button type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium">Plant Seed</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SeedCard({ seed, logs }) {
    const today = new Date().toISOString().split('T')[0];
    const isWateredToday = logs?.some(log => log.date === today);
    const [justWatered, setJustWatered] = useState(false);

    // Fallback if older seeds don't have difficulty
    const diffInfo = SEED_DIFFICULTIES[seed.difficulty] || SEED_DIFFICULTIES.Medium;

    const handleWater = async () => {
        if (isWateredToday) return;
        await waterSeed(seed.id, today);
        setJustWatered(true);
        setTimeout(() => setJustWatered(false), 2000);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to uproot this seed?')) {
            await deleteSeed(seed.id);
        }
    }

    const streak = logs ? logs.length : 0; // Simplified streak for now

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 flex items-center justify-between"
        >
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[seed.category] || CATEGORY_COLORS.General)}>
                        {seed.category}
                    </span>
                    <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", diffInfo.color)}>
                        {diffInfo.points} pts
                    </span>
                    <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mr-2">{seed.title}</h3>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1">{seed.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs font-medium text-stone-400">
                    <span className="flex items-center gap-1"><Leaf size={12} /> {streak} days watered</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleDelete}
                    className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                    title="Remove Seed"
                >
                    <Trash2 size={18} />
                </button>

                <button
                    onClick={handleWater}
                    disabled={isWateredToday}
                    className={clsx(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-md relative overflow-hidden",
                        isWateredToday
                            ? "bg-green-100 text-green-600 cursor-default"
                            : "bg-blue-50 text-blue-500 hover:bg-blue-100 hover:scale-105 active:scale-95"
                    )}
                >
                    {isWateredToday ? (
                        <CheckCircle size={24} />
                    ) : (
                        <Droplets size={24} />
                    )}

                    {justWatered && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            className="absolute inset-0 bg-blue-400 rounded-full"
                        />
                    )}
                </button>
            </div>
        </motion.div>
    );
}

export default function GardenPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Live queries automatically update the UI when DB changes
    const seeds = useLiveQuery(() => db.seeds.toArray());
    const logs = useLiveQuery(() => db.logs.toArray());

    // Group logs by seed_id for easy access
    const logsBySeed = logs?.reduce((acc, log) => {
        if (!acc[log.seed_id]) acc[log.seed_id] = [];
        acc[log.seed_id].push(log);
        return acc;
    }, {});

    // Calculate Score
    const today = new Date().toISOString().split('T')[0];

    // Calculate Stats
    let maxPossibleScore = 0;
    let currentScore = 0;

    seeds?.forEach(seed => {
        const points = (SEED_DIFFICULTIES[seed.difficulty] || SEED_DIFFICULTIES.Medium).points;
        maxPossibleScore += points;

        const isCompleted = logsBySeed?.[seed.id]?.some(log => log.date === today);
        if (isCompleted) {
            currentScore += points;
        }
    });

    const progressPercent = maxPossibleScore > 0 ? (currentScore / maxPossibleScore) * 100 : 0;
    const isGoalMet = progressPercent >= 80;

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-900 pb-20">
            <Navbar />
            <div className="pt-16">

                <header className="bg-white dark:bg-slate-800 shadow-sm p-6 mb-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-green-600 dark:text-green-400">
                            <Sprout size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">My Garden of Life</h1>
                            <p className="text-stone-500 dark:text-stone-400">Nurture your seeds into daily habits.</p>
                        </div>
                    </div>
                </header>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-stone-100 dark:bg-slate-700">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className={clsx(
                            "h-full transition-all duration-500",
                            isGoalMet ? "bg-gradient-to-r from-amber-400 to-green-500" : "bg-amber-400"
                        )}
                    />
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Score Card */}
                <section className={clsx(
                    "text-center py-6 rounded-2xl shadow-inner border transition-colors relative overflow-hidden",
                    isGoalMet
                        ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
                        : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-amber-100 dark:border-slate-700"
                )}>
                    <div className="relative z-10">
                        <Trophy className={clsx("mx-auto mb-2 h-8 w-8", isGoalMet ? "text-green-600" : "text-amber-500")} />
                        <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 table-nums">
                            {currentScore} <span className="text-sm font-normal text-stone-500">/ {maxPossibleScore} pts</span>
                        </h2>
                        <p className={clsx("text-sm mt-1 font-medium", isGoalMet ? "text-green-700" : "text-stone-600 dark:text-stone-400")}>
                            {isGoalMet ? "✨ Goal Met! Cosmic Alignment Achieved ✨" : "Today's Karmic Progress (Goal: 80%)"}
                        </p>
                    </div>

                    {isGoalMet && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
                        />
                    )}
                </section>

                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-stone-600 dark:text-stone-300 uppercase text-xs tracking-wider">Your Seeds</h3>
                        <span className="text-xs text-stone-400">{seeds?.length || 0} active</span>
                    </div>

                    <div className="space-y-3 pb-24">
                        {seeds?.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-stone-300 dark:border-stone-700">
                                <Sprout size={48} className="mx-auto text-stone-300 mb-3" />
                                <p className="text-stone-500 font-medium">Your garden is empty.</p>
                                <p className="text-stone-400 text-sm mb-4">Plant a seed to start growing.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-amber-600 font-bold text-sm hover:underline"
                                >
                                    + Plant First Seed
                                </button>
                            </div>
                        )}

                        {seeds?.map(seed => (
                            <SeedCard
                                key={seed.id}
                                seed={seed}
                                logs={logsBySeed?.[seed.id]}
                            />
                        ))}
                    </div>
                </section>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg shadow-amber-600/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20"
            >
                <Plus size={28} />
            </button>

            <PlantSeedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
