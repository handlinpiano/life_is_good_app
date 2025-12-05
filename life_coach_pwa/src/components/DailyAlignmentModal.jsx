import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Sparkles, Loader2 } from 'lucide-react';
import { getAlignment, chatWithChart } from '../utils/api';
import ReactMarkdown from 'react-markdown';

export default function DailyAlignmentModal({ isOpen, onClose, birthData }) {
    const [alignment, setAlignment] = useState(null);
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    useEffect(() => {
        if (isOpen && birthData) {
            loadAlignment();
        }
    }, [isOpen, birthData]);

    const loadAlignment = async () => {
        setLoading(true);
        try {
            // Using birth location for current transit location (assumption)
            const data = await getAlignment(birthData.latitude, birthData.longitude);
            setAlignment(data);

            // Auto-fetch advice once we have alignment
            fetchAdvice(data);
        } catch (err) {
            console.error("Failed to load alignment", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdvice = async (alignData) => {
        setLoadingAdvice(true);
        try {
            const prompt = `
            Analyze the current daily alignment for me based on my birth chart.
            
            Current Transits:
            - Tithi: ${alignData.tithi.name} (${alignData.tithi.paksha} Paksha)
            - Moon Nakshatra: ${alignData.moon_nakshatra.name}
            - Special Yoga: ${alignData.tithi.special || 'None'}

            Please provide:
            1. The "Theme of the Day" (1 sentence).
            2. A specific "Actionable Advice" for today considering these energies.
            3. Which of my "Seeds" (habits) I should focus on most today? (Assume generic habits like Meditation, Exercise, Journaling if you don't know mine yet).
            
            Keep it inspiring and concise.
            `;

            const response = await chatWithChart(birthData, prompt, []);
            if (response.success) {
                setAdvice(response.response);
            }
        } catch (err) {
            console.error("Failed to get advice", err);
        } finally {
            setLoadingAdvice(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                        <Sparkles className="text-yellow-300" /> Daily Alignment
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">Your Cosmic Weather Report</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p>Aligning stars...</p>
                        </div>
                    ) : alignment ? (
                        <div className="space-y-6">
                            {/* Tithi Display */}
                            <div className="flex gap-4">
                                <div className="flex-1 bg-amber-50 dark:bg-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700 text-center">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Lunar Day (Tithi)</div>
                                    <div className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center justify-center gap-2">
                                        <Moon size={18} /> {alignment.tithi.name}
                                    </div>
                                </div>
                                <div className="flex-1 bg-blue-50 dark:bg-slate-800 p-4 rounded-xl border border-blue-100 dark:border-slate-700 text-center">
                                    <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Moon Star</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {alignment.moon_nakshatra.name}
                                    </div>
                                </div>
                            </div>

                            {/* Advice Section */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                                    <Sun size={18} className="text-orange-500" /> Guru's Guidance for Today
                                </h3>

                                <div className="bg-stone-50 dark:bg-slate-800/50 p-5 rounded-xl border border-stone-100 dark:border-slate-700 text-stone-700 dark:text-stone-300 prose prose-sm dark:prose-invert max-w-none">
                                    {loadingAdvice ? (
                                        <div className="flex items-center gap-2 text-stone-400 italic">
                                            <Loader2 size={16} className="animate-spin" /> Divining insights...
                                        </div>
                                    ) : (
                                        <ReactMarkdown>{advice}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-red-400">Failed to load cosmic data.</div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
