import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useStore, SEED_CATEGORIES, WISDOM_CATEGORIES } from '../store';
import { chat, formatChartAsText } from '../utils/api';
import { Send, User, Sparkles, ArrowLeft, Sprout, Check, RotateCcw, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getLocalDateString } from '../utils/constants';

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
                    <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm">Practice Suggestion</h4>
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
                    <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm">Wisdom Note</h4>
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

export default function ChatPage() {
    // Get user profile data from Zustand (for chart context)
    const user = useStore(state => state.user);
    const chart = useStore(state => state.chart);
    const dasha = useStore(state => state.dasha);

    const { isAuthenticated } = useConvexAuth();
    const navigate = useNavigate();

    // Convex queries and mutations
    const messages = useQuery(api.messages.list, isAuthenticated ? {} : "skip") || [];
    const seeds = useQuery(api.seeds.list, isAuthenticated ? {} : "skip") || [];
    const wisdom = useQuery(api.wisdom.list, isAuthenticated ? {} : "skip") || [];
    const checkins = useQuery(api.checkins.list, isAuthenticated ? {} : "skip") || [];

    const addMessage = useMutation(api.messages.add);
    const clearMessages = useMutation(api.messages.clear);
    const upsertSeed = useMutation(api.seeds.upsert);
    const upsertWisdom = useMutation(api.wisdom.upsert);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedSeeds, setAcceptedSeeds] = useState(new Set());
    const [acceptedWisdom, setAcceptedWisdom] = useState(new Set());
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const messagesEndRef = useRef(null);

    const today = getLocalDateString();
    const latestCheckin = checkins.length > 0
        ? checkins.reduce((latest, c) => c.date > latest.date ? c : latest, checkins[0])
        : null;

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    const isSeedPlanted = (title) => {
        if (acceptedSeeds.has(title)) return true;
        return seeds.some(seed => seed.title === title);
    };

    const isWisdomSaved = (title) => {
        if (acceptedWisdom.has(title)) return true;
        return wisdom.some(w => w.title === title);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [sortedMessages, loading]);

    // Build system prompt fresh each time (not stored)
    const buildSystemPrompt = () => {
        const chartText = formatChartAsText(chart, dasha);

        // Current date/time context for the guru
        const now = new Date();
        const dateContext = `Current date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current time: ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

        // Seeds with today's completion status
        let seedContext = '';
        if (seeds.length > 0) {
            const seedList = seeds.map(s => {
                const wateredToday = s.completedDates?.includes(today);
                return `- ${s.title} (${s.category}) ${wateredToday ? '✓ done today' : '○ not yet today'}`;
            }).join('\n');
            seedContext = `

MY GARDEN (daily practices I'm cultivating):
${seedList}

Encourage me on practices not yet done today. Don't suggest seeds I already have.`;
        }

        // Wisdom notes summary
        let wisdomContext = '';
        if (wisdom.length > 0) {
            const wisdomList = wisdom.slice(0, 10).map(w => `- ${w.title} (${w.category})`).join('\n');
            wisdomContext = `

MY SAVED WISDOM (${wisdom.length} notes):
${wisdomList}${wisdom.length > 10 ? '\n... and more' : ''}

Don't re-offer wisdom I've already saved.`;
        }

        // Today's cosmic energy (if we have a recent check-in)
        let panchangContext = '';
        if (latestCheckin?.panchang && latestCheckin.date === today) {
            const p = latestCheckin.panchang;
            panchangContext = `

TODAY'S COSMIC ENERGY:
- Tithi: ${p.tithi || 'Unknown'}
- Nakshatra: ${p.nakshatra || 'Unknown'}
- Day Lord: ${p.day_lord || 'Unknown'}
- Yoga: ${p.yoga || 'Unknown'}

Reference today's energy when relevant to my questions.`;
        }

        return `You are a wise Vedic life guide - an omniscient spiritual mentor who integrates ancient wisdom with practical modern guidance.

${dateContext}

I am ${user.name || 'a seeker'}.

My profile:
- Gender: ${user.gender || 'Not specified'}
- Profession: ${user.profession || 'Not specified'}
- Relationship Status: ${user.relationshipStatus || 'Not specified'}

${chartText}${panchangContext}${seedContext}${wisdomContext}

Use this astrological context to personalize ALL your guidance - for health, relationships, career, spirituality, or any topic I ask about.

IMPORTANT CAPABILITIES:

1. SEEDS (daily practices): When you identify a helpful daily practice, offer it:
[OFFER_SEED: {"title": "Practice Name", "category": "Health|Spiritual|Relationship|Career|General", "description": "Why this helps", "difficulty": "Easy|Medium|Hard|Heroic"}]

2. WISDOM NOTES: When I ask you to save something (recipe, mantra, insight):
[WISDOM_NOTE: {"title": "Note Title", "category": "Recipe|Practice|Insight|Mantra|Reminder|General", "content": "The full content to save"}]

Be warm, wise, and practical. Connect insights across all areas of life.`;
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        const messageId = String(Date.now());

        // Add user message to Convex
        await addMessage({
            localId: messageId,
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        });

        setInput('');
        setLoading(true);

        try {
            // Build system prompt fresh (always current)
            const systemPrompt = buildSystemPrompt();

            // Get conversation history (just user/assistant messages)
            const apiHistory = [
                { role: 'system', content: systemPrompt },
                ...sortedMessages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMessage }
            ];

            const response = await chat(userMessage, apiHistory);

            if (response.success) {
                // Add assistant message to Convex
                await addMessage({
                    localId: String(Date.now()),
                    role: 'assistant',
                    content: response.response,
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Chat error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptSeed = async (offer) => {
        await upsertSeed({
            localId: String(Date.now()),
            title: offer.title,
            category: offer.category || 'General',
            description: offer.description || '',
            streak: 0,
            completedDates: [],
            active: true
        });
        setAcceptedSeeds(prev => new Set([...prev, offer.title]));
    };

    const handleAcceptWisdom = async (offer) => {
        await upsertWisdom({
            localId: String(Date.now()),
            title: offer.title,
            category: offer.category || 'General',
            content: offer.content
        });
        setAcceptedWisdom(prev => new Set([...prev, offer.title]));
    };

    const handleRestartConversation = async () => {
        await clearMessages();
        setShowRestartConfirm(false);
    };

    // Helper to render content with potential seed and wisdom offers
    const renderMessageContent = (content) => {
        const seedRegex = /\[OFFER_SEED:\s*({.*?})\]/gs;
        const wisdomRegex = /\[WISDOM_NOTE:\s*({.*?})\]/gs;

        const seedMatches = [...content.matchAll(seedRegex)];
        const wisdomMatches = [...content.matchAll(wisdomRegex)];

        if (seedMatches.length > 0 || wisdomMatches.length > 0) {
            let cleanContent = content.replace(seedRegex, '').replace(wisdomRegex, '').trim();

            const seedOffers = seedMatches.map(match => {
                try { return JSON.parse(match[1]); } catch { return null; }
            }).filter(Boolean);

            const wisdomOffers = wisdomMatches.map(match => {
                try { return JSON.parse(match[1]); } catch { return null; }
            }).filter(Boolean);

            return (
                <>
                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                    {seedOffers.map((offerData, index) => (
                        <SeedOfferCard
                            key={`seed-${offerData.title}-${index}`}
                            offer={offerData}
                            onAccept={handleAcceptSeed}
                            accepted={isSeedPlanted(offerData.title)}
                        />
                    ))}
                    {wisdomOffers.map((offerData, index) => (
                        <WisdomOfferCard
                            key={`wisdom-${offerData.title}-${index}`}
                            offer={offerData}
                            onAccept={handleAcceptWisdom}
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
            <header className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white shadow-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-3xl">🙏</span>
                    <div>
                        <h1 className="font-bold text-lg">Vedic Guide</h1>
                        <p className="text-xs opacity-90 uppercase tracking-wider">Your Spiritual Companion</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {sortedMessages.length > 0 && (
                        <button
                            onClick={() => setShowRestartConfirm(true)}
                            className="flex items-center gap-1 text-sm font-medium hover:bg-white/20 px-2 py-1.5 rounded-full transition-colors opacity-70 hover:opacity-100"
                            title="Start new conversation"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Welcome message if no history */}
                {sortedMessages.length === 0 && !loading && (
                    <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                        <span className="text-6xl mb-4 block">🙏</span>
                        <p className="text-lg font-medium mb-2">Namaste, {user.name || 'Seeker'}</p>
                        <p className="text-sm">Ask me anything about health, relationships, career, or spirituality.</p>
                        <p className="text-sm mt-1">I'll guide you using your unique cosmic blueprint.</p>
                    </div>
                )}

                {sortedMessages.map((msg) => (
                    <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                            msg.role === 'user' ? "bg-stone-200 text-stone-600" : "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
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
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
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
                        placeholder="Ask about health, relationships, career, spirituality..."
                        className="flex-1 bg-stone-100 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 dark:text-white"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        aria-label="Send Message"
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white transition-colors",
                            !input.trim() || loading ? "bg-stone-300 dark:bg-slate-600" : "bg-gradient-to-br from-amber-500 to-orange-600"
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
                                Start Fresh?
                            </h3>
                            <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
                                This will clear your conversation history. Your seeds and wisdom notes will remain.
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
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
