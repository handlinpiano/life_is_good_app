import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { getLocalDateString } from '../utils/constants';

const SCRIPTURE_CACHE_KEY = 'daily_scripture';

// Generate scripture via API
async function generateScripture() {
    const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

    const systemPrompt = `You are a wise spiritual guide well-versed in Eastern wisdom traditions. Generate a daily scripture/wisdom teaching.

Choose randomly from these sources:
- Bhagavad Gita verses
- Upanishads passages
- Rig Veda hymns
- Buddhist sutras
- Zen koans
- Sufi poetry (Rumi, Hafiz)
- Tao Te Ching
- Yoga Sutras of Patanjali

Respond in this exact JSON format:
{
    "text": "The actual scripture/verse/poem text",
    "source": "Source name (e.g., 'Bhagavad Gita 2.47' or 'Rumi')",
    "meaning": "A brief, accessible explanation of its meaning and how to apply it today (2-3 sentences)"
}

Be authentic - use actual verses when possible. Keep the scripture text concise but complete.`;

    const response = await fetch(`${API_BASE}/chat/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: "Generate today's scripture teaching.",
            history: [{ role: 'system', content: systemPrompt }]
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate scripture');
    }

    const data = await response.json();

    // Parse the JSON response
    try {
        // Try to extract JSON from the response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
    } catch (e) {
        // Fallback if parsing fails
        return {
            text: data.response,
            source: 'Daily Wisdom',
            meaning: ''
        };
    }
}

// Get cached scripture or null
function getCachedScripture() {
    try {
        const cached = localStorage.getItem(SCRIPTURE_CACHE_KEY);
        if (!cached) return null;

        const { date, scripture } = JSON.parse(cached);
        const today = getLocalDateString();

        if (date === today) {
            return scripture;
        }
        return null;
    } catch {
        return null;
    }
}

// Cache scripture for today
function cacheScripture(scripture) {
    const today = getLocalDateString();
    localStorage.setItem(SCRIPTURE_CACHE_KEY, JSON.stringify({
        date: today,
        scripture
    }));
}

export default function ScriptureCard() {
    const [scripture, setScripture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        async function loadScripture() {
            // Check cache first
            const cached = getCachedScripture();
            if (cached) {
                setScripture(cached);
                setLoading(false);
                return;
            }

            // Generate new scripture
            try {
                setLoading(true);
                setError(null);
                const newScripture = await generateScripture();
                cacheScripture(newScripture);
                setScripture(newScripture);
            } catch (err) {
                console.error('Failed to generate scripture:', err);
                setError('Could not load today\'s scripture');
            } finally {
                setLoading(false);
            }
        }

        loadScripture();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const newScripture = await generateScripture();
            cacheScripture(newScripture);
            setScripture(newScripture);
        } catch (err) {
            setError('Could not refresh scripture');
        } finally {
            setLoading(false);
        }
    };

    // Loading shimmer
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-amber-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={18} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Daily Scripture</span>
                </div>
                <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-amber-200/50 dark:bg-slate-600 rounded w-full"></div>
                    <div className="h-4 bg-amber-200/50 dark:bg-slate-600 rounded w-5/6"></div>
                    <div className="h-4 bg-amber-200/50 dark:bg-slate-600 rounded w-4/6"></div>
                    <div className="h-3 bg-amber-200/30 dark:bg-slate-600/50 rounded w-1/3 mt-3"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-amber-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Daily Scripture</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">{error}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-amber-200 dark:border-slate-600"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Daily Scripture</span>
                </div>
            </div>

            {/* Scripture Text */}
            <blockquote className="text-stone-700 dark:text-stone-200 italic leading-relaxed">
                "{scripture?.text}"
            </blockquote>

            {/* Source */}
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium">
                — {scripture?.source}
            </p>

            {/* Expandable Meaning */}
            {scripture?.meaning && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 mt-3 transition-colors"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expanded ? 'Hide meaning' : 'Show meaning'}
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 pt-2 border-t border-amber-200 dark:border-slate-600">
                                    {scripture.meaning}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
}
