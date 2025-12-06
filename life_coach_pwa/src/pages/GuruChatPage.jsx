import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { chatWithChart, getAlignment } from '../utils/api';
import { db, addSeed, addWisdom } from '../utils/db';
import { Send, User, Sparkles, ArrowLeft, Sprout, Check, RotateCcw, BookOpen } from 'lucide-react';
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

// Component to display a Wisdom Note offer inside the chat
function WisdomOfferCard({ offer, onAccept, accepted }) {
    if (!offer) return null;

    return (
        <div className="mt-3 mb-1 bg-violet-50 dark:bg-slate-900 border border-violet-200 dark:border-violet-900/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="bg-violet-100 dark:bg-slate-800 p-2 rounded-lg text-violet-600 font-bold shrink-0">
                    <BookOpen size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm">Guruji shares Wisdom</h4>
                    <p className="text-stone-700 dark:text-stone-300 font-medium text-lg my-1">{offer.title}</p>
                    <div className="text-sm text-stone-600 dark:text-stone-400 mb-3 whitespace-pre-wrap bg-white dark:bg-slate-800 p-3 rounded-lg border border-stone-100 dark:border-stone-700">
                        {offer.content}
                    </div>

                    <div className="flex gap-2 text-xs mb-3">
                        <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border rounded-md">{offer.category}</span>
                    </div>

                    {accepted ? (
                        <button disabled className="w-full py-2 bg-green-100 text-green-700 rounded-lg font-medium flex justify-center items-center gap-2 cursor-default">
                            <Check size={16} /> Saved to Wisdom
                        </button>
                    ) : (
                        <button
                            onClick={() => onAccept(offer)}
                            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                        >
                            <BookOpen size={16} /> Save to Wisdom
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GuruChatPage() {
    const { guruId } = useParams();
    const user = useStore(state => state.user);
    const birthData = user.birthData;

    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedSeeds, setAcceptedSeeds] = useState(new Set());
    const [acceptedWisdom, setAcceptedWisdom] = useState(new Set());
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const messagesEndRef = useRef(null);

    // Load existing seeds and wisdom to check which offers have been accepted and for context
    const existingSeeds = useLiveQuery(() => db.seeds.toArray(), []);
    const existingWisdom = useLiveQuery(() => db.wisdom.toArray(), []);

    // Helper to check if a seed title has been planted
    const isSeedPlanted = (title) => {
        if (acceptedSeeds.has(title)) return true;
        return existingSeeds?.some(seed => seed.title === title) || false;
    };

    // Helper to check if a wisdom note has been saved
    const isWisdomSaved = (title) => {
        if (acceptedWisdom.has(title)) return true;
        return existingWisdom?.some(w => w.title === title) || false;
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

    // Helper to generate the System Prompt with current seed context
    const getSystemPrompt = (includeSeeds = true) => {
        // Build seed context
        let seedContext = '';
        if (includeSeeds && existingSeeds && existingSeeds.length > 0) {
            const seedList = existingSeeds.map(s => `- ${s.title} (${s.category}, ${s.difficulty})`).join('\n');
            seedContext = `

CURRENT SEEDS IN GARDEN (practices I'm working on):
${seedList}

You should be aware of these existing practices and can reference them in your guidance. Don't offer seeds I already have.`;
        }

        return `You are ${guru.name}, a ${guru.role}. This is your ONLY identity - never use any other name.

I am ${user.name || 'a seeker'}.

My profile:
- Gender: ${user.gender || 'Not specified'}
- Profession: ${user.profession || 'Not specified'}
- Relationship Status: ${user.relationshipStatus || 'Not specified'}
- Sexual Orientation: ${user.sexualOrientation || 'Not specified'}

You are my trusted guide for ${guru.topics}. We have an ongoing relationship - continue our conversation naturally. If this is our first meeting, warmly introduce yourself and ask how you can help today. Otherwise, pick up where we left off.

My birth chart details are available to you. Use this astrological context to personalize your guidance.${seedContext}

IMPORTANT CAPABILITIES:

1. SEEDS (daily practices): When you identify a helpful daily practice, offer it as a seed:
Format: [OFFER_SEED: {"title": "Practice Name", "category": "Health|Spiritual|Relationship|Career|General", "description": "Why this helps", "difficulty": "Easy|Medium|Hard|Heroic"}]

2. WISDOM NOTES (recipes, mantras, insights): When I ask you to save something as a "note", "wisdom", or "wisdom note" (like a recipe, mantra, insight, or important information), format it as:
[WISDOM_NOTE: {"title": "Note Title", "category": "Recipe|Practice|Insight|Mantra|Reminder|General", "content": "The full formatted content to save"}]

Always use these special formats when offering seeds or when I ask you to save something to my wisdom.`;
    };

    // Start conversation if no history exists
    useEffect(() => {
        const startChat = async () => {
            if (!birthData) {
                navigate('/');
                return;
            }

            // Only start if history is empty, seeds are loaded, and we are ready
            if (history !== undefined && history.length === 0 && existingSeeds !== undefined && !loading) {
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
                    console.error("Failed to start chat", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        startChat();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guruId, birthData, navigate, history, existingSeeds]);

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

    const handleAcceptWisdom = async (offer) => {
        await addWisdom(offer.title, offer.category, offer.content, guruId);
        // Add to local state immediately for instant UI feedback
        setAcceptedWisdom(prev => new Set([...prev, offer.title]));
    };

    const handleRestartConversation = async () => {
        // Delete all messages for this guru
        await db.messages.where('guru_id').equals(guruId).delete();
        setShowRestartConfirm(false);
        // The useLiveQuery will automatically update and trigger a new intake
    };

    // Helper to render content with potential seed and wisdom offers
    const renderMessageContent = (content) => {
        // Regex to find ALL [OFFER_SEED: { ... }] and [WISDOM_NOTE: { ... }] occurrences
        const seedRegex = /\[OFFER_SEED:\s*({.*?})\]/gs;
        const wisdomRegex = /\[WISDOM_NOTE:\s*({.*?})\]/gs;

        const seedMatches = [...content.matchAll(seedRegex)];
        const wisdomMatches = [...content.matchAll(wisdomRegex)];

        if (seedMatches.length > 0 || wisdomMatches.length > 0) {
            // Remove all tags from content to get clean text
            let cleanContent = content.replace(seedRegex, '').replace(wisdomRegex, '').trim();

            // Parse seed offers
            const seedOffers = seedMatches.map(match => {
                try {
                    return JSON.parse(match[1]);
                } catch (e) {
                    console.error("Failed to parse seed offer", e);
                    return null;
                }
            }).filter(Boolean);

            // Parse wisdom offers
            const wisdomOffers = wisdomMatches.map(match => {
                try {
                    return JSON.parse(match[1]);
                } catch (e) {
                    console.error("Failed to parse wisdom offer", e);
                    return null;
                }
            }).filter(Boolean);

            return (
                <>
                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                    {seedOffers.map((offerData, index) => (
                        <SeedOfferCard
                            key={`seed-${offerData.title}-${index}`}
                            offer={offerData}
                            onAccept={(offer) => handleAcceptSeed(offer)}
                            accepted={isSeedPlanted(offerData.title)}
                        />
                    ))}
                    {wisdomOffers.map((offerData, index) => (
                        <WisdomOfferCard
                            key={`wisdom-${offerData.title}-${index}`}
                            offer={offerData}
                            onAccept={(offer) => handleAcceptWisdom(offer)}
                            accepted={isWisdomSaved(offerData.title)}
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
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-3xl">{guru.icon}</span>
                    <div>
                        <h1 className="font-bold text-lg">{guru.name}</h1>
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
                        placeholder="Type a message..."
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
