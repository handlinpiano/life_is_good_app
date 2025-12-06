import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { X, Loader2, Sparkles, Sprout } from 'lucide-react';
import { getAlignment, chatWithChart } from '../utils/api';
import { db } from '../utils/db';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';

const GURU_CONFIG = {
    'health_ayurveda': {
        name: 'Vaidya Jiva',
        role: 'Ayurvedic Healer',
        icon: '🌿',
        color: 'from-green-600 to-emerald-600',
        focus: 'diet, digestion, sleep patterns, and dosha balance',
        seedCategories: ['Health']
    },
    'health_yoga': {
        name: 'Yogini Shakti',
        role: 'Movement Guide',
        icon: '🧘',
        color: 'from-emerald-600 to-teal-600',
        focus: 'physical activity, asana practice, breathwork, and energy flow',
        seedCategories: ['Health']
    },
    'spiritual_sadhana': {
        name: 'Swami Prana',
        role: 'Sadhana Mentor',
        icon: '🕉️',
        color: 'from-indigo-600 to-violet-600',
        focus: 'meditation, mantra practice, spiritual routines, and inner stillness',
        seedCategories: ['Spiritual']
    },
    'spiritual_wisdom': {
        name: 'Acharya Satya',
        role: 'Wisdom Keeper',
        icon: '📿',
        color: 'from-violet-600 to-purple-600',
        focus: 'philosophical reflection, dharmic living, and scriptural wisdom',
        seedCategories: ['Spiritual', 'General']
    },
    'life_romance': {
        name: 'Devi Kama',
        role: 'Relationship Guide',
        icon: '❤️',
        color: 'from-rose-600 to-pink-600',
        focus: 'love, relationships, emotional connection, and intimacy',
        seedCategories: ['Relationship']
    },
    'life_career': {
        name: 'Raja Dharma',
        role: 'Career Strategist',
        icon: '👑',
        color: 'from-blue-600 to-indigo-600',
        focus: 'career success, professional growth, purpose, and ambition',
        seedCategories: ['Career', 'General']
    }
};

export default function GuruDailyGuidance({ isOpen, onClose, guruId }) {
    const user = useStore(state => state.user);
    const chart = useStore(state => state.chart);
    const birthData = user.birthData;

    const [alignment, setAlignment] = useState(null);
    const [guidance, setGuidance] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingGuidance, setLoadingGuidance] = useState(false);

    // Get user's seeds for this guru's domain
    const guru = GURU_CONFIG[guruId];
    const seeds = useLiveQuery(
        () => db.seeds.filter(seed =>
            guru?.seedCategories.includes(seed.category)
        ).toArray(),
        [guruId]
    );

    // Get today's watering status for relevant seeds
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = useLiveQuery(
        () => db.logs.where('date').equals(today).toArray(),
        [today]
    );

    useEffect(() => {
        if (isOpen && birthData && guruId) {
            loadDailyGuidance();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, guruId]);

    const loadDailyGuidance = async () => {
        setLoading(true);
        setGuidance('');
        try {
            const alignData = await getAlignment(birthData.latitude, birthData.longitude);
            setAlignment(alignData);
            await fetchGuidance(alignData);
        } catch (err) {
            console.error("Failed to load alignment", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGuidance = async (alignData) => {
        if (!guru) return;

        setLoadingGuidance(true);
        try {
            // Build seed context
            const seedList = seeds?.map(s => {
                const watered = todayLogs?.some(log => log.seed_id === s.id);
                return `- ${s.title} (${s.category}, ${s.difficulty}) ${watered ? '[DONE TODAY]' : '[NOT YET]'}`;
            }).join('\n') || 'No seeds planted yet in my domain.';

            // Get relevant chart info based on guru domain
            let chartContext = '';
            if (chart?.D1) {
                const planets = chart.D1.planets;
                if (guruId.includes('health')) {
                    chartContext = `
Ascendant: ${chart.D1.ascendant?.sign}
Moon Sign: ${planets?.Moon?.sign} in ${planets?.Moon?.nakshatra}
6th House (Health): Check for any afflictions
Mars (Vitality): ${planets?.Mars?.sign}`;
                } else if (guruId.includes('spiritual')) {
                    chartContext = `
Ascendant: ${chart.D1.ascendant?.sign}
Moon Sign: ${planets?.Moon?.sign} in ${planets?.Moon?.nakshatra}
Jupiter (Wisdom): ${planets?.Jupiter?.sign}
Ketu (Spirituality): ${planets?.Ketu?.sign}
9th House Lord position for dharma`;
                } else if (guruId === 'life_romance') {
                    chartContext = `
Ascendant: ${chart.D1.ascendant?.sign}
Venus (Love): ${planets?.Venus?.sign}
Moon (Emotions): ${planets?.Moon?.sign}
7th House matters for relationships`;
                } else if (guruId === 'life_career') {
                    chartContext = `
Ascendant: ${chart.D1.ascendant?.sign}
Sun (Authority): ${planets?.Sun?.sign}
Saturn (Career): ${planets?.Saturn?.sign}
10th House matters for profession
Mercury (Skills): ${planets?.Mercury?.sign}`;
                }
            }

            const prompt = `You are ${guru.name}, the ${guru.role}. This is your ONLY identity.

CONTEXT FOR TODAY:
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Tithi: ${alignData.tithi.name} (${alignData.tithi.paksha} Paksha)
- Moon Nakshatra: ${alignData.moon_nakshatra.name}
${alignData.tithi.special ? `- Special Day: ${alignData.tithi.special}` : ''}

CLIENT'S BIRTH CHART HIGHLIGHTS:
${chartContext}

CLIENT'S SEEDS (Habits) IN YOUR DOMAIN:
${seedList}

Provide personalized daily guidance for ${user.name || 'this seeker'} focusing on ${guru.focus}.

Your response should include:
1. **Today's Theme** - A one-line theme for today based on the cosmic energies (from your perspective as ${guru.role})
2. **Morning Ritual** - A specific practice or action to start the day aligned with today's energy
3. **Seed Focus** - Which of their seeds (if any) they should prioritize today and why
4. **Watch Out For** - One thing to be mindful of or avoid today
5. **Evening Reflection** - A contemplation or closing practice for the day

Keep the tone warm but authoritative. Be specific, not generic. Reference the actual cosmic conditions.`;

            const response = await chatWithChart(birthData, prompt, []);
            if (response.success) {
                setGuidance(response.response);
            }
        } catch (err) {
            console.error("Failed to get guidance", err);
            setGuidance("I apologize, but I am unable to connect with the cosmic energies at this moment. Please try again.");
        } finally {
            setLoadingGuidance(false);
        }
    };

    if (!isOpen || !guru) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${guru.color} p-6 text-white relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{guru.icon}</span>
                        <div>
                            <h2 className="text-2xl font-serif font-bold">{guru.name}</h2>
                            <p className="text-white/80 text-sm">{guru.role} • Daily Guidance</p>
                        </div>
                    </div>
                </div>

                {/* Cosmic Context Bar */}
                {alignment && (
                    <div className="bg-stone-50 dark:bg-slate-800 px-6 py-3 border-b border-stone-100 dark:border-slate-700 flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Sun size={14} className="text-amber-500" />
                            <span className="text-stone-600 dark:text-stone-300">{alignment.tithi.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-indigo-500" />
                            <span className="text-stone-600 dark:text-stone-300">{alignment.moon_nakshatra.name}</span>
                        </div>
                        {seeds?.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-auto">
                                <Sprout size={14} className="text-green-500" />
                                <span className="text-stone-600 dark:text-stone-300">{seeds.length} seeds</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p>Consulting the cosmic energies...</p>
                        </div>
                    ) : loadingGuidance ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p>{guru.name} is preparing your guidance...</p>
                        </div>
                    ) : guidance ? (
                        <div className="prose prose-stone dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{guidance}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-stone-400">
                            Unable to load guidance. Please try again.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-stone-50 dark:bg-slate-800 border-t border-stone-100 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r ${guru.color} hover:opacity-90 transition-opacity`}
                    >
                        Thank you, {guru.name.split(' ')[0]}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
