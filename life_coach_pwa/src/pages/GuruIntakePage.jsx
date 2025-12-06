import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { chatWithChart, getAlignment } from '../utils/api';
import { db, addSeed } from '../utils/db';
import { Send, User, Sparkles, ArrowRight, Sprout, Check, CheckCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const GURU_PERSONAS = {
    'health_ayurveda': {
        name: 'Vaidya Jiva',
        role: 'Ayurvedic Healer',
        topics: 'diet, sleep patterns, daily routines, digestive health, and dosha balance',
        icon: '🌿',
        color: 'bg-green-600'
    },
    'health_yoga': {
        name: 'Yogini Shakti',
        role: 'Movement Guide',
        topics: 'physical activity, flexibility, breathwork, energy levels, and body awareness',
        icon: '🧘',
        color: 'bg-emerald-600'
    },
    'spiritual_sadhana': {
        name: 'Swami Prana',
        role: 'Sadhana Mentor',
        topics: 'meditation practice, spiritual routines, mantra work, and inner stillness',
        icon: '🕉️',
        color: 'bg-indigo-600'
    },
    'spiritual_wisdom': {
        name: 'Acharya Satya',
        role: 'Wisdom Keeper',
        topics: 'philosophical questions, scriptural guidance, life meaning, and dharmic path',
        icon: '📿',
        color: 'bg-violet-600'
    },
    'life_romance': {
        name: 'Devi Kama',
        role: 'Relationship Guide',
        topics: 'relationship status, past patterns, what you seek in a partner, and emotional needs',
        icon: '❤️',
        color: 'bg-rose-600'
    },
    'life_career': {
        name: 'Raja Dharma',
        role: 'Career Strategist',
        topics: 'career satisfaction, professional goals, skills, and work-life balance',
        icon: '👑',
        color: 'bg-blue-600'
    }
};

// Component to display a Seed Offer inside the chat
function SeedOfferCard({ offer, onAccept, accepted }) {
    if (!offer) return null;

    return (
        <div className="mt-3 mb-1 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-slate-800 p-2 rounded-lg text-amber-600 font-bold shrink-0">
                    <Sprout size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm">Guruji offers a Seed</h4>
                    <p className="text-stone-700 dark:text-stone-300 font-medium text-lg my-1">{offer.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{offer.description}</p>

                    <div className="flex gap-2 text-xs mb-3">
                        <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border rounded-md">{offer.category}</span>
                        <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border rounded-md">{offer.difficulty}</span>
                    </div>

                    {accepted ? (
                        <button disabled className="w-full py-2 bg-green-100 text-green-700 rounded-lg font-medium flex justify-center items-center gap-2 cursor-default">
                            <Check size={16} /> Planted in Garden
                        </button>
                    ) : (
                        <button
                            onClick={() => onAccept(offer)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                        >
                            <Sprout size={16} /> Accept & Plant
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GuruIntakePage() {
    const { guruId } = useParams();
    const user = useStore(state => state.user);
    const birthData = user.birthData;
    const selectedGurus = useStore(state => state.selectedGurus);
    const completedIntakes = useStore(state => state.completedIntakes);
    const markIntakeComplete = useStore(state => state.markIntakeComplete);

    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedSeeds, setAcceptedSeeds] = useState(new Set());
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const messagesEndRef = useRef(null);

    // Load existing seeds to check which offers have been accepted
    const existingSeeds = useLiveQuery(() => db.seeds.toArray(), []);

    // Check if this intake is already complete
    const isIntakeComplete = completedIntakes.includes(guruId);

    // Helper to check if a seed title has been planted
    const isSeedPlanted = (title) => {
        if (acceptedSeeds.has(title)) return true;
        return existingSeeds?.some(seed => seed.title === title) || false;
    };

    // Find the next guru that needs intake
    const getNextGuru = () => {
        const currentIndex = selectedGurus.indexOf(guruId);
        for (let i = currentIndex + 1; i < selectedGurus.length; i++) {
            if (!completedIntakes.includes(selectedGurus[i])) {
                return selectedGurus[i];
            }
        }
        // Check from beginning if we wrapped around
        for (let i = 0; i < currentIndex; i++) {
            if (!completedIntakes.includes(selectedGurus[i])) {
                return selectedGurus[i];
            }
        }
        return null;
    };

    const handleCompleteIntake = () => {
        markIntakeComplete(guruId);
        const nextGuru = getNextGuru();
        if (nextGuru) {
            navigate(`/intake/${nextGuru}`);
        } else {
            // All intakes complete, go to dashboard
            navigate('/dashboard');
        }
    };

    // Load conversation history from Dexie
    const history = useLiveQuery(
        () => db.messages.where('guru_id').equals(guruId).toArray(),
        [guruId]
    );

    const guru = GURU_PERSONAS[guruId] || {
        name: 'Vedic Guide',
        role: 'Life Coach',
        topics: 'your general life goals and happiness',
        icon: '✨',
        color: 'bg-amber-600'
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, loading]);

    // Helper to generate the System Prompt
    const getSystemPrompt = () => {
        return `You are ${guru.name}, a ${guru.role}. This is your ONLY identity - never use any other name.

        I am a new client named ${user.name || 'Client'}.

        Here is my profile:
        - Gender: ${user.gender || 'Not specified'}
        - Profession: ${user.profession || 'Not specified'}
        - Relationship Status: ${user.relationshipStatus || 'Not specified'}
        - Sexual Orientation: ${user.sexualOrientation || 'Not specified'} (Tailor advice accordingly).

        Conduct a warm, short intake interview with me (ask one question at a time) to learn about my ${guru.topics}. 
        
        IMPORTANT: If you identify a habit or practice that would help me, you can "OFFER" it as a seed. 
        To do this, you MUST put the offer in this specific JSON format on a separate line: 
        [OFFER_SEED: {"title": "Practice Name", "category": "General", "description": "Short reason why", "difficulty": "Medium"}]
        Valid categories: Health, Spiritual, Relationship, Career, General.
        Valid difficulties: Easy, Medium, Hard, Heroic.
        
        My birth chart details are available to you. Start by introducing yourself and asking the first most important question.`;
    };

    // Initial Intake Trigger
    useEffect(() => {
        const startIntake = async () => {
            if (!birthData) {
                navigate('/');
                return;
            }

            // Only start if history is empty and we are ready
            if (history !== undefined && history.length === 0 && !loading) {
                setLoading(true);
                try {
                    const systemPrompt = getSystemPrompt();
                    const response = await chatWithChart(birthData, systemPrompt, []);

                    if (response.success) {
                        await db.messages.add({
                            guru_id: guruId,
                            role: 'assistant',
                            content: response.response,
                            timestamp: new Date()
                        });
                    }
                } catch (err) {
                    console.error("Failed to start intake", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        startIntake();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guruId, birthData, navigate, history]); // Dependencies crucial here

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = {
            guru_id: guruId,
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        await db.messages.add(userMsg);
        setInput('');
        setLoading(true);

        try {
            // Prepare history for API
            // CRITICAL FIX: We must re-inject the System Prompt as the FIRST message
            // Otherwise the AI forgets who it is (Persona) and its instructions (Seeds)
            let recentHistory = (history || []).map(m => ({
                role: m.role,
                content: m.content
            }));

            // Prepend System Persona & Instructions
            recentHistory.unshift({
                role: 'system',
                content: getSystemPrompt()
            });

            // --- CONTEXT INJECTION ---
            try {
                // 1. Get Astrological Data (using birth location as proxy for current)
                const alignData = await getAlignment(birthData.latitude, birthData.longitude);
                if (alignData && alignData.tithi) {
                    const tithiNum = alignData.tithi.number;
                    // Calculate days to next Ekadashi (11 or 26)
                    let nextEkadashiDays = 0;
                    let nextEkadashiType = "";

                    if (tithiNum < 11) {
                        nextEkadashiDays = 11 - tithiNum;
                        nextEkadashiType = "Shukla Ekadashi";
                    } else if (tithiNum === 11) {
                        nextEkadashiDays = 0;
                        nextEkadashiType = "Today is Shukla Ekadashi!";
                    } else if (tithiNum < 26) {
                        nextEkadashiDays = 26 - tithiNum;
                        nextEkadashiType = "Krishna Ekadashi";
                    } else if (tithiNum === 26) {
                        nextEkadashiDays = 0;
                        nextEkadashiType = "Today is Krishna Ekadashi!";
                    } else {
                        // > 26, next is 11 (next month) => (30-tithi) + 11
                        nextEkadashiDays = (30 - tithiNum) + 11;
                        nextEkadashiType = "Shukla Ekadashi (Next Cycle)";
                    }

                    const astroContext = `
[SYSTEM_CONTEXT_UPDATE]
Current Time: ${new Date().toLocaleString()}
Astrological Day (Tithi): ${alignData.tithi.name} (${alignData.tithi.paksha})
Moon Nakshatra: ${alignData.moon_nakshatra.name}
Ekadashi Status: ${nextEkadashiDays === 0 ? nextEkadashiType : `${nextEkadashiType} is in ${nextEkadashiDays} days.`}
[/SYSTEM_CONTEXT_UPDATE]
`;
                    // Push as a system message at the END of history so it's fresh context
                    recentHistory.push({ role: 'system', content: astroContext });
                }
            } catch (e) {
                console.error("Failed to inject astro context", e);
            }

            const response = await chatWithChart(birthData, input, recentHistory); // Note: API takes (data, question, history)

            if (response.success) {
                await db.messages.add({
                    guru_id: guruId,
                    role: 'assistant',
                    content: response.response,
                    timestamp: new Date()
                });
            }
        } catch (err) {
            console.error(err);
            // Optional: add error message to local state only
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptSeed = async (offer) => {
        await addSeed(offer.title, offer.category, offer.description, offer.difficulty, guruId);
        // Add to local state immediately for instant UI feedback
        setAcceptedSeeds(prev => new Set([...prev, offer.title]));
    };

    const handleRestartConversation = async () => {
        // Delete all messages for this guru
        await db.messages.where('guru_id').equals(guruId).delete();
        setShowRestartConfirm(false);
        // The useLiveQuery will automatically update and trigger a new intake
    };

    // Helper to render content with potential seed offers
    const renderMessageContent = (content) => {
        // Regex to find ALL [OFFER_SEED: { ... }] occurrences (global flag)
        const seedRegex = /\[OFFER_SEED:\s*({.*?})\]/gs;
        const matches = [...content.matchAll(seedRegex)];

        if (matches.length > 0) {
            // Remove all seed tags from content to get clean text
            const cleanContent = content.replace(seedRegex, '').trim();

            // Parse all seed offers
            const seedOffers = matches.map(match => {
                try {
                    return JSON.parse(match[1]);
                } catch (e) {
                    console.error("Failed to parse seed offer", e);
                    return null;
                }
            }).filter(Boolean);

            return (
                <>
                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                    {seedOffers.map((offerData, index) => (
                        <SeedOfferCard
                            key={`${offerData.title}-${index}`}
                            offer={offerData}
                            onAccept={(offer) => handleAcceptSeed(offer)}
                            accepted={isSeedPlanted(offerData.title)}
                        />
                    ))}
                </>
            );
        }

        return <ReactMarkdown>{content}</ReactMarkdown>;
    };

    return (
        <div className="flex flex-col h-screen bg-stone-50 dark:bg-slate-900 pt-16">
            <Navbar />

            {/* Header */}
            <header className={clsx("p-4 text-white shadow-md flex items-center justify-between shrink-0", guru.color)}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{guru.icon}</span>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            {guru.name}
                            {isIntakeComplete && (
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <CheckCircle size={12} /> Complete
                                </span>
                            )}
                        </h1>
                        <p className="text-xs opacity-90 uppercase tracking-wider">{guru.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {history?.length > 0 && (
                        <button
                            onClick={() => setShowRestartConfirm(true)}
                            className="flex items-center gap-1 text-sm font-medium hover:bg-white/20 px-2 py-1.5 rounded-full transition-colors opacity-70 hover:opacity-100"
                            title="Restart conversation"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                    {!isIntakeComplete && history?.length >= 2 && (
                        <button
                            onClick={handleCompleteIntake}
                            className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                        >
                            <CheckCircle size={16} /> Complete Intake
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1 text-sm font-medium hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        Dashboard <ArrowRight size={16} />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {history?.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                            msg.role === 'user' ? "bg-stone-200 text-stone-600" : `${guru.color} text-white`
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                        </div>

                        <div className={clsx(
                            "p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-white text-stone-800 rounded-tr-none border border-stone-100"
                                : "bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 rounded-tl-none border border-stone-100 dark:border-stone-700"
                        )}>
                            {renderMessageContent(msg.content)}
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 mr-auto"
                    >
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", guru.color, "text-white")}>
                            <Sparkles size={16} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center border border-stone-100 dark:border-stone-700">
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-white dark:bg-slate-800 border-t border-stone-200 dark:border-stone-700">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 bg-stone-100 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 dark:text-white"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        aria-label="Send Message"
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white transition-colors",
                            !input.trim() || loading ? "bg-stone-300 dark:bg-slate-600" : guru.color
                        )}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </footer>

            {/* Restart Confirmation Modal */}
            {showRestartConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
                    >
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <RotateCcw className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
                                Restart Conversation?
                            </h3>
                            <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
                                This will delete all messages with {guru.name}. Any seeds you've already planted will remain in your garden.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRestartConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestartConversation}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                                >
                                    Restart
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
