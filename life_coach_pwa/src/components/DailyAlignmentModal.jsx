import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X, Sun, Moon, Sparkles, Loader2, Sprout, RefreshCw, Flame, Calendar, ChevronLeft } from 'lucide-react';
import { getAlignment, chat } from '../utils/api';
import ReactMarkdown from 'react-markdown';

const GURU_CONFIG = {
    'health_ayurveda': {
        name: 'Vaidya Jiva',
        icon: '🌿',
        color: 'bg-green-600',
        focus: 'diet and daily health routines',
        seedCategories: ['Health']
    },
    'health_yoga': {
        name: 'Yogini Shakti',
        icon: '🧘',
        color: 'bg-emerald-600',
        focus: 'movement and breathwork',
        seedCategories: ['Health']
    },
    'spiritual_sadhana': {
        name: 'Swami Prana',
        icon: '🕉️',
        color: 'bg-indigo-600',
        focus: 'meditation and spiritual practice',
        seedCategories: ['Spiritual']
    },
    'spiritual_wisdom': {
        name: 'Acharya Satya',
        icon: '📿',
        color: 'bg-violet-600',
        focus: 'wisdom and dharmic living',
        seedCategories: ['Spiritual', 'General']
    },
    'life_romance': {
        name: 'Devi Kama',
        icon: '❤️',
        color: 'bg-rose-600',
        focus: 'love and relationships',
        seedCategories: ['Relationship']
    },
    'life_career': {
        name: 'Raja Dharma',
        icon: '👑',
        color: 'bg-blue-600',
        focus: 'career and success',
        seedCategories: ['Career', 'General']
    }
};

export default function DailyAlignmentModal({ isOpen, onClose }) {
    const user = useStore(state => state.user);
    const seeds = useStore(state => state.seeds);
    const logs = useStore(state => state.logs);
    const checkins = useStore(state => state.checkins);
    const recordCheckin = useStore(state => state.recordCheckin);
    const calculateStreak = useStore(state => state.calculateStreak);
    const birthData = user.birthData;

    const [alignment, setAlignment] = useState(null);
    const [guruGuidance, setGuruGuidance] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingGurus, setLoadingGurus] = useState({});
    const [streak, setStreak] = useState({ current: 0, longest: 0, total: 0 });
    const [showHistory, setShowHistory] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today);

    // Get check-in history (last 30)
    const sortedCheckins = [...checkins]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);

    // All gurus are always available now (no intake flow)
    const activeGurus = Object.keys(GURU_CONFIG);

    useEffect(() => {
        if (isOpen && birthData) {
            loadAlignment();
            setStreak(calculateStreak());
        }
        if (isOpen) {
            setShowHistory(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const loadAlignment = async () => {
        setLoading(true);
        setGuruGuidance({});
        try {
            const data = await getAlignment(birthData.latitude, birthData.longitude);
            setAlignment(data);

            // Record check-in for streak tracking
            const seedsWatered = todayLogs.length;
            const seedsTotal = seeds.length;
            recordCheckin(today, {
                tithi: data.tithi.name,
                nakshatra: data.moon_nakshatra.name,
                yoga: data.yoga.name,
                day_lord: data.vara.lord
            }, seedsWatered, seedsTotal);

            // Refresh streak after recording
            setStreak(calculateStreak());

            // Load guidance for all active gurus in parallel
            if (activeGurus.length > 0) {
                await loadAllGuidance(data);
            }
        } catch (err) {
            console.error("Failed to load alignment", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllGuidance = async (alignData) => {
        // Start loading all gurus
        const loadingState = {};
        activeGurus.forEach(id => { loadingState[id] = true; });
        setLoadingGurus(loadingState);

        // Load in parallel
        const promises = activeGurus.map(guruId => fetchGuruGuidance(guruId, alignData));
        await Promise.all(promises);
    };

    const fetchGuruGuidance = async (guruId, alignData) => {
        const guru = GURU_CONFIG[guruId];
        if (!guru) return;

        setLoadingGurus(prev => ({ ...prev, [guruId]: true }));

        try {
            // Get seeds for this guru's domain
            const guruSeeds = seeds.filter(s => guru.seedCategories.includes(s.category));
            const seedList = guruSeeds.map(s => {
                const watered = todayLogs.some(log => log.seed_id === s.id);
                return `${s.title}${watered ? ' [DONE]' : ''}`;
            }).join(', ') || 'none yet';

            const systemPrompt = `You are ${guru.name}, a Vedic wisdom guide. Give a BRIEF 2-3 sentence daily tip focusing on ${guru.focus}. Be specific to today's cosmic energy. One actionable insight only. No greetings or sign-offs.`;

            const userMessage = `Today's Energy: ${alignData.tithi.name} (${alignData.tithi.paksha}), Moon in ${alignData.moon_nakshatra.name}, ${alignData.vara.name} (ruled by ${alignData.vara.lord}).

My seeds in your domain: ${seedList}`;

            const response = await chat(userMessage, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]);
            if (response.success) {
                setGuruGuidance(prev => ({ ...prev, [guruId]: response.response }));
            }
        } catch (err) {
            console.error(`Failed to get guidance from ${guru.name}`, err);
            setGuruGuidance(prev => ({ ...prev, [guruId]: "Unable to connect today." }));
        } finally {
            setLoadingGurus(prev => ({ ...prev, [guruId]: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start justify-between pr-10">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {showHistory ? (
                                    <>
                                        <button onClick={() => setShowHistory(false)} className="hover:bg-white/20 rounded-full p-1 -ml-1">
                                            <ChevronLeft size={20} />
                                        </button>
                                        History
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="text-yellow-300" size={22} /> Daily Alignment
                                    </>
                                )}
                            </h2>
                            <p className="text-indigo-100 text-sm mt-1">
                                {showHistory
                                    ? `${streak.total} total check-ins`
                                    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                                }
                            </p>
                        </div>

                        {/* Streak Badge */}
                        {!showHistory && streak.current > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                                <Flame size={16} className="text-orange-300" />
                                <span className="font-bold text-sm">{streak.current}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {showHistory ? (
                        <div className="space-y-3">
                            {/* Streak Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-orange-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{streak.current}</div>
                                    <div className="text-xs text-stone-500 dark:text-stone-400">Current</div>
                                </div>
                                <div className="bg-violet-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{streak.longest}</div>
                                    <div className="text-xs text-stone-500 dark:text-stone-400">Longest</div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{streak.total}</div>
                                    <div className="text-xs text-stone-500 dark:text-stone-400">Total</div>
                                </div>
                            </div>

                            {/* Past Check-ins */}
                            <div className="space-y-2">
                                {sortedCheckins.length > 0 ? (
                                    sortedCheckins.map((checkin) => {
                                        const dateObj = new Date(checkin.date + 'T12:00:00');
                                        const isToday = checkin.date === today;
                                        return (
                                            <div
                                                key={checkin.id}
                                                className={`p-3 rounded-xl border ${isToday
                                                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                                                    : 'bg-stone-50 dark:bg-slate-800 border-stone-100 dark:border-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                                                            {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            {isToday && <span className="ml-2 text-xs text-violet-600 dark:text-violet-400">(Today)</span>}
                                                        </div>
                                                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                            {checkin.panchang?.tithi} · {checkin.panchang?.nakshatra}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                            <Sprout size={14} />
                                                            <span className="text-sm font-medium">{checkin.seeds_watered}/{checkin.seeds_total}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-stone-400 text-sm">
                                        No history yet. Check in daily to build your streak!
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : loading && !alignment ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p>Reading the cosmic energies...</p>
                        </div>
                    ) : alignment ? (
                        <div className="space-y-4">
                            {/* Panchang Summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-amber-50 dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-slate-700">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                                        <Moon size={12} /> Tithi
                                    </div>
                                    <div className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                                        {alignment.tithi.name}
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-xl border border-blue-100 dark:border-slate-700">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                                        <Sparkles size={12} /> Nakshatra
                                    </div>
                                    <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                                        {alignment.moon_nakshatra.name}
                                    </div>
                                </div>
                                <div className="bg-violet-50 dark:bg-slate-800 p-3 rounded-xl border border-violet-100 dark:border-slate-700">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                                        <Sun size={12} /> Day Lord
                                    </div>
                                    <div className="font-semibold text-violet-900 dark:text-violet-100 text-sm">
                                        {alignment.vara.lord}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-slate-800 p-3 rounded-xl border border-emerald-100 dark:border-slate-700">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                                        <Sprout size={12} /> Yoga
                                    </div>
                                    <div className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">
                                        {alignment.yoga.name}
                                    </div>
                                </div>
                            </div>

                            {/* Guru Guidance Section */}
                            {activeGurus.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
                                            Your Guides' Wisdom
                                        </h3>
                                        <button
                                            onClick={() => loadAllGuidance(alignment)}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                            disabled={Object.values(loadingGurus).some(Boolean)}
                                        >
                                            <RefreshCw size={12} /> Refresh
                                        </button>
                                    </div>

                                    {activeGurus.map(guruId => {
                                        const guru = GURU_CONFIG[guruId];
                                        if (!guru) return null;

                                        const isLoading = loadingGurus[guruId];
                                        const guidance = guruGuidance[guruId];

                                        return (
                                            <div
                                                key={guruId}
                                                className="bg-stone-50 dark:bg-slate-800 rounded-xl p-3 border border-stone-100 dark:border-slate-700"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xl">{guru.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                                                            {guru.name}
                                                        </div>
                                                        {isLoading ? (
                                                            <div className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                                                <Loader2 size={12} className="animate-spin" /> Consulting...
                                                            </div>
                                                        ) : guidance ? (
                                                            <div className="text-sm text-stone-600 dark:text-stone-400 mt-1 prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                                                                <ReactMarkdown>{guidance}</ReactMarkdown>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}

                            {/* Ekadashi Notice */}
                            {alignment.tithi.special === 'Ekadashi' && (
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <div className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                        Today is Ekadashi
                                    </div>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                        An auspicious day for fasting, spiritual practice, and introspection.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-red-400 text-sm">
                            Failed to load cosmic data. Please try again.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-stone-50 dark:bg-slate-800 border-t border-stone-100 dark:border-slate-700 flex gap-2">
                    {!showHistory && (
                        <button
                            onClick={() => setShowHistory(true)}
                            className="py-2.5 px-4 rounded-xl font-medium text-stone-600 dark:text-stone-300 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 transition-colors text-sm flex items-center gap-1.5"
                        >
                            <Calendar size={16} />
                            History
                        </button>
                    )}
                    <button
                        onClick={showHistory ? () => setShowHistory(false) : onClose}
                        className="flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity text-sm"
                    >
                        {showHistory ? 'Back to Today' : 'Begin Your Day'}
                    </button>
                </div>
            </div>
        </div>
    );
}
