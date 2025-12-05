import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAstrology } from '../context/AstrologyContext';
import { chatWithChart, getAlignment } from '../utils/api';
import { db, addSeed } from '../utils/db';
import { motion } from 'framer-motion';
import { Send, User, Sparkles, ArrowRight, Sprout, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useLiveQuery } from 'dexie-react-hooks';

const GURU_PERSONAS = {
    'life_finance': {
        name: 'Astro-Finance Guide',
        role: 'Financial Astrologer',
        topics: 'financial goals, risk tolerance, current debts, and career aspirations',
        icon: '💼',
        color: 'bg-emerald-600'
    },
    'life_romance': {
        name: 'Relationship Guide',
        role: 'Vedic Matchmaker',
        topics: 'relationship status, past relationship patterns, what you look for in a partner, and emotional needs',
        icon: '❤️',
        color: 'bg-rose-600'
    },
    'health_wellness': {
        name: 'Health & Wellness Coach',
        role: 'Medical Astrologer',
        topics: 'current health issues, diet preferences, activity levels, and vitality goals',
        icon: '🧘',
        color: 'bg-teal-600'
    },
    'career_purpose': {
        name: 'Career & Purpose Coach',
        role: 'Vedic Career Counselor',
        topics: 'current job satisfaction, skills, dream roles, and work-life balance',
        icon: '🚀',
        color: 'bg-blue-600'
    },
    'spiritual_growth': {
        name: 'Spiritual Guide',
        role: 'Spiritual Mentor',
        topics: 'meditation experience, spiritual beliefs, life purpose questions, and inner peace',
        icon: '🕉️',
        color: 'bg-violet-600'
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
    const { birthData } = useAstrology();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Load conversation history from Dexie
    const history = useLiveQuery(
        () => db.messages.where('guru_id').equals(guruId).toArray(),
        [guruId]
    );

    const guru = GURU_PERSONAS[guruId] || {
        name: 'Life Guru',
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
                    // System prompt with "Seed Offer" instructions
                    const systemPrompt = `Act as the ${guru.role}. I am a new client. Conduct a warm, short intake interview with me (ask one question at a time) to learn about my ${guru.topics}. 
                    
                    IMPORTANT: If you identify a habit or practice that would help me, you can "OFFER" it as a seed. 
                    To do this, you MUST put the offer in this specific JSON format on a separate line: 
                    [OFFER_SEED: {"title": "Practice Name", "category": "General", "description": "Short reason why", "difficulty": "Medium"}]
                    Valid categories: Health, Spiritual, Relationship, Career, General.
                    Valid difficulties: Easy, Medium, Hard, Heroic.
                    
                    My birth chart details are available to you. Start by introducing yourself and asking the first most important question.`;

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
            // We pass the FULL history to the AI so it "remembers everything"
            let recentHistory = (history || []).map(m => ({
                role: m.role,
                content: m.content
            }));

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

    const handleAcceptSeed = async (offer, messageId) => {
        await addSeed(offer.title, offer.category, offer.description, offer.difficulty, guruId);

        // We need to mark this specific message/offer as "accepted" in the DB so it persists
        // For simplicity, we can just update the content string to append a flag or handle it via a separate store
        // But for this MVP, let's just trigger a toast or visual change. 
        // A robust way: update the message content to replace [OFFER_SEED: ...] with [ACCEPTED_SEED: ...]
        // Let's find the message using messageId (which we need to pass down)
    };

    // Helper to render content with potential seed offers
    const renderMessageContent = (content, msgId) => {
        // Regex to find [OFFER_SEED: { ... }]
        // Note: AI might put it anywhere.
        const seedRegex = /\[OFFER_SEED:\s*({.*?})\]/s;
        const match = content.match(seedRegex);

        if (match) {
            const before = content.replace(seedRegex, '').trim();
            const jsonStr = match[1];

            let offerData = null;
            try {
                offerData = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse seed offer", e);
            }

            return (
                <>
                    <ReactMarkdown>{before}</ReactMarkdown>
                    {offerData && (
                        <SeedOfferCard
                            offer={offerData}
                            onAccept={(offer) => handleAcceptSeed(offer, msgId)}
                            accepted={false} // Todo: Track acceptance state
                        />
                    )}
                </>
            );
        }

        return <ReactMarkdown>{content}</ReactMarkdown>;
    };

    return (
        <div className="flex flex-col h-screen bg-stone-50 dark:bg-slate-900">
            {/* Header */}
            <header className={clsx("p-4 text-white shadow-md flex items-center justify-between", guru.color)}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{guru.icon}</span>
                    <div>
                        <h1 className="font-bold text-lg">{guru.name}</h1>
                        <p className="text-xs opacity-90 uppercase tracking-wider">Intake Session</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/garden')}
                    className="flex items-center gap-1 text-sm font-medium hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                >
                    Skip to Garden <ArrowRight size={16} />
                </button>
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
                            {renderMessageContent(msg.content, msg.id)}
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
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white transition-colors",
                            !input.trim() || loading ? "bg-stone-300 dark:bg-slate-600" : guru.color
                        )}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </footer>
        </div>
    );
}
