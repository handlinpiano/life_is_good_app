```javascript
import { useState } from 'react';
import { useAstrology } from '../context/AstrologyContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ChevronUp, User, Users, Heart, Briefcase, Activity, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import BirthForm from '../components/BirthForm';
import NorthIndianChart from '../components/NorthIndianChart';
import PlanetTable from '../components/PlanetTable';

const GURUS = [
    {
        id: 'health_ayurveda',
        category: 'Health',
        name: 'Vaidya Jiva',
        title: 'Ayurvedic Healer',
        description: 'Ancient wisdom for diet, sleep, and balance.',
        icon: Activity,
        color: 'bg-green-100 text-green-700',
        border: 'border-green-200'
    },
    {
        id: 'health_yoga',
        category: 'Health',
        name: 'Yogini Shakti',
        title: 'Movement Guide',
        description: 'Asanas and pranayama for vitality.',
        icon: Zap,
        color: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200'
    },
    {
        id: 'spiritual_sadhana',
        category: 'Spiritual',
        name: 'Swami Prana',
        title: 'Sadhana Mentor',
        description: 'Deep practices and meditation techniques.',
        icon: Moon,
        color: 'bg-indigo-100 text-indigo-700',
        border: 'border-indigo-200'
    },
    {
        id: 'spiritual_wisdom',
        category: 'Spiritual',
        name: 'Acharya Satya',
        title: 'Wisdom Keeper',
        description: 'Philosophy and scriptural guidance.',
        icon: Sparkles,
        color: 'bg-violet-100 text-violet-700',
        border: 'border-violet-200'
    },
    {
        id: 'life_romance',
        category: 'Life & Love',
        name: 'Devi Kama',
        title: 'Relationship Guide',
        description: 'Navigating love, romance, and compatibility.',
        icon: Heart,
        color: 'bg-rose-100 text-rose-700',
        border: 'border-rose-200'
    },
    {
        id: 'life_career',
        category: 'Life & Love',
        name: 'Raja Dharma',
        title: 'Career Strategist',
        description: 'Success, purpose, and professional growth.',
        icon: Briefcase,
        color: 'bg-blue-100 text-blue-700',
        border: 'border-blue-200'
    }
];

function PartnerModal({ isOpen, onClose, onSubmit, loading, error }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">Partner Details</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700">
                        <X size={24} className="text-stone-500" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="mb-6 text-stone-600 dark:text-stone-300">
                        To provide the best relationship guidance, we need to understand your partner's cosmic blueprint for synastry analysis.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <BirthForm onSubmit={onSubmit} loading={loading} />
                </div>
            </motion.div>
        </div>
    );
}

export default function DashboardPage() {
    const { birthData, loading: loadingAstrology } = useAstrology();
    const navigate = useNavigate();
    const [selectedGurus, setSelectedGurus] = useState([]);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showBlueprint, setShowBlueprint] = useState(false); // Collapsed by default
    const [showAlignment, setShowAlignment] = useState(false);

    const toggleGuru = (id) => {
        setSelectedGurus(prev =>
            prev.includes(id)
                ? prev.filter(g => g !== id)
                : [...prev, id]
        );
    };

    const handleStartJourney = () => {
        if (selectedGurus.length === 0) {
            alert("Please select at least one Guide to begin your journey.");
            return;
        }

        // Proceed to Intake for the first selected Guru
        // In the future, we could have a "Hub" or iterate through them
        const firstGuruId = selectedGurus[0];
        navigate(`/ intake / ${ firstGuruId } `);
    };

    const handlePartnerSubmit = async (data) => {
        const success = await calculateCompatibility(data);
        if (success) {
            setShowPartnerModal(false);
            // After partner intake, go to Relationship Guru intake or generic
            navigate('/intake/life_romance');
        }
    };

    if (!chart) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-stone-500">Please complete the intake first.</p>
            </div>
        );
    }

    // Group by category
    const categories = ['Health', 'Spiritual', 'Life & Love'];

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-900 pb-20">
            <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Life Guru</h1>
                    <div className="text-sm font-medium text-stone-600 dark:text-stone-400">
                        {chart.ascendant_sign} Ascendant
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Daily Alignment Button - Prominent */}
                <div className="max-w-4xl mx-auto px-4 mt-6">
                    <button
                        onClick={() => setShowAlignment(true)}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Sparkles className="text-yellow-300" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">Daily Cosmic Alignment</h3>
                                <p className="text-white/80 text-sm">Check today's energy & advice</p>
                            </div>
                        </div>
                        <ChevronRight className="transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Cosmic Blueprint Section */}
                <div className="max-w-4xl mx-auto px-4 mt-6">
                    <button
                        onClick={() => setShowBlueprint(!showBlueprint)}
                        className="flex items-center gap-2 text-stone-500 hover:text-amber-600 font-medium w-full"
                    >
                        {showBlueprint ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        {showBlueprint ? "Hide Cosmic Blueprint" : "Show Your Cosmic Blueprint"}
                    </button>

                    <AnimatePresence>
                        {showBlueprint && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
                                    <div>
                                        <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 mb-4 text-center">Rashi Chart (D1)</h3>
                                        <NorthIndianChart chart={chart} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 mb-4 text-center">Planetary Positions</h3>
                                        <PlanetTable planets={chart.planets} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                <section className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Choose Your Guides</h2>
                    <p className="text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                        Select the Gurus you wish to consult. You can choose one or multiple across different areas of life.
                    </p>
                </section>

                {categories.map(category => (
                    <section key={category} className="space-y-4">
                        <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 border-b border-stone-200 pb-2">
                            {category}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {GURUS.filter(g => g.category === category).map(guru => {
                                const isSelected = selectedGurus.includes(guru.id);
                                const Icon = guru.icon;

                                return (
                                    <motion.div
                                        key={guru.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleGuru(guru.id)}
                                        className={clsx(
                                            "cursor-pointer rounded-xl p-4 border-2 transition-all relative overflow-hidden",
                                            isSelected
                                                ? `border - amber - 500 bg - white shadow - md dark: bg - slate - 800`
                                                : "border-transparent bg-white shadow-sm dark:bg-slate-800 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={clsx("p-3 rounded-lg", guru.color)}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg dark:text-white">{guru.name}</h4>
                                                <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">{guru.title}</p>
                                                <p className="text-sm text-stone-600 dark:text-stone-300">{guru.description}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-amber-500">
                                                    <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                                                        ✓
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-stone-200 dark:border-stone-800 z-20">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div className="text-sm text-stone-500">
                            {selectedGurus.length} Gurus selected
                        </div>
                        <button
                            onClick={handleStartJourney}
                            className={clsx(
                                "px-6 py-2 rounded-full font-bold transition-colors",
                                selectedGurus.length > 0
                                    ? "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20"
                                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                            )}
                            disabled={selectedGurus.length === 0}
                        >
                            Start Journey →
                        </button>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showPartnerModal && (
                    <PartnerModal
                        isOpen={showPartnerModal}
                        onClose={() => setShowPartnerModal(false)}
                        onSubmit={handlePartnerSubmit}
                        loading={loading}
                        error={error}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
