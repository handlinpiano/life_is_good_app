import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ChevronUp, User, Users, Heart, Briefcase, Activity, Sparkles, Zap, Moon, X, CheckCircle, MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import BirthForm from '../components/BirthForm';
import NorthIndianChart from '../components/NorthIndianChart';
import DailyAlignmentModal from '../components/DailyAlignmentModal';
import GuruDailyGuidance from '../components/GuruDailyGuidance';
import PlanetTable from '../components/PlanetTable';
import DivisionalCharts from '../components/DivisionalCharts';
import Navbar from '../components/Navbar';

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
    const user = useStore(state => state.user);
    const chart = useStore(state => state.chart);
    const loading = useStore(state => state.loading);
    const error = useStore(state => state.error);
    const calculateCompatibility = useStore(state => state.calculateCompatibility);
    const selectedGurus = useStore(state => state.selectedGurus);
    const setSelectedGurus = useStore(state => state.setSelectedGurus);
    const completedIntakes = useStore(state => state.completedIntakes);

    const navigate = useNavigate();
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showBlueprint, setShowBlueprint] = useState(false);
    const [showAlignment, setShowAlignment] = useState(false);
    const [dailyGuidanceGuru, setDailyGuidanceGuru] = useState(null);

    // Check if we're in "intake mode" (gurus selected but not all completed)
    const hasSelectedGurus = selectedGurus.length > 0;
    const allIntakesComplete = hasSelectedGurus && selectedGurus.every(id => completedIntakes.includes(id));
    const inIntakeMode = hasSelectedGurus && !allIntakesComplete;

    const toggleGuru = (id) => {
        // Don't allow changes if in intake mode
        if (inIntakeMode) return;

        const newSelection = selectedGurus.includes(id)
            ? selectedGurus.filter(g => g !== id)
            : [...selectedGurus, id];
        setSelectedGurus(newSelection);
    };

    const handleStartJourney = () => {
        if (selectedGurus.length === 0) {
            alert("Please select at least one Guide to begin your journey.");
            return;
        }
        // Find first incomplete guru
        const nextGuru = selectedGurus.find(id => !completedIntakes.includes(id));
        if (nextGuru) {
            navigate('/intake/' + nextGuru);
        }
    };

    const handleGuruClick = (guruId) => {
        const isCompleted = completedIntakes.includes(guruId);
        const isSelected = selectedGurus.includes(guruId);

        if (allIntakesComplete && isCompleted) {
            // All intakes done - clicking a completed guru shows daily guidance
            setDailyGuidanceGuru(guruId);
        } else if (inIntakeMode) {
            // In intake mode, only allow clicking selected gurus
            if (isSelected) {
                navigate('/intake/' + guruId);
            }
        } else {
            toggleGuru(guruId);
        }
    };

    const handlePartnerSubmit = async (data) => {
        const birth_data = {
            date: `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`,
            time: `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`,
            latitude: data.latitude,
            longitude: data.longitude
        };

        const success = await calculateCompatibility(birth_data);
        if (success) {
            setShowPartnerModal(false);
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

    const categories = ['Health', 'Spiritual', 'Life & Love'];

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-900 pb-20">
            <Navbar />
            <div className="pt-16">
                <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-16 z-10 transition-all">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-amber-900 dark:text-amber-100 text-lg">Dashboard</p>
                            {user.name && (
                                <p className="text-sm text-stone-500 dark:text-stone-400">Welcome, {user.name}</p>
                            )}
                        </div>
                        <div className="text-sm font-medium text-stone-600 dark:text-stone-400">
                            {chart.D1?.ascendant?.sign} Ascendant
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                    {/* Daily Alignment Button */}
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

                    {/* Cosmic Blueprint Section */}
                    <div>
                        <button
                            onClick={() => setShowBlueprint(!showBlueprint)}
                            className="flex items-center gap-2 text-stone-500 hover:text-amber-600 font-medium w-full"
                        >
                            {showBlueprint ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            {showBlueprint ? "Hide Cosmic Blueprint" : "Show Your Cosmic Blueprint"}
                        </button>

                        <AnimatePresence>
                            {showBlueprint && chart.D1 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
                                        <div>
                                            <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 mb-4 text-center">Rashi Chart (D1)</h3>
                                            <NorthIndianChart chart={chart.D1} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 mb-4 text-center">Planetary Highlights</h3>
                                            <PlanetTable
                                                chart={{
                                                    ...chart.D1,
                                                    navamsa: chart.D9?.planets,
                                                    ayanamsa: chart.meta?.ayanamsa,
                                                    ayanamsa_type: chart.meta?.ayanamsa_type
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Divisional Charts */}
                                    <div className="mt-6">
                                        <DivisionalCharts chart={chart} chartStyle="north" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <section className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">
                            {allIntakesComplete ? "Your Guides" : inIntakeMode ? "Your Guides" : "Choose Your Guides"}
                        </h2>
                        <p className="text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                            {allIntakesComplete
                                ? "Click on any guide for personalized daily guidance based on today's cosmic alignment."
                                : inIntakeMode
                                    ? "Complete your intake with each selected guide. Click on a guide to continue or start their intake."
                                    : "Select the Gurus you wish to consult. You can choose one or multiple across different areas of life."}
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
                                    const isCompleted = completedIntakes.includes(guru.id);
                                    const Icon = guru.icon;

                                    // In intake mode, grey out unselected gurus
                                    const isGreyedOut = inIntakeMode && !isSelected;

                                    return (
                                        <motion.div
                                            key={guru.id}
                                            whileHover={!isGreyedOut ? { scale: 1.02 } : {}}
                                            whileTap={!isGreyedOut ? { scale: 0.98 } : {}}
                                            onClick={() => handleGuruClick(guru.id)}
                                            className={clsx(
                                                "rounded-xl p-4 border-2 transition-all relative overflow-hidden",
                                                isGreyedOut
                                                    ? "opacity-40 cursor-not-allowed border-transparent bg-stone-100 dark:bg-slate-900"
                                                    : "cursor-pointer",
                                                !isGreyedOut && isSelected && isCompleted
                                                    ? 'border-green-500 bg-green-50 shadow-md dark:bg-green-900/20'
                                                    : !isGreyedOut && isSelected
                                                        ? 'border-amber-500 bg-white shadow-md dark:bg-slate-800'
                                                        : !isGreyedOut && "border-transparent bg-white shadow-sm dark:bg-slate-800 hover:shadow-md"
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={clsx(
                                                    "p-3 rounded-lg transition-all",
                                                    isGreyedOut ? "bg-stone-200 text-stone-400 dark:bg-slate-700" : guru.color
                                                )}>
                                                    <Icon size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={clsx(
                                                        "font-bold text-lg",
                                                        isGreyedOut ? "text-stone-400 dark:text-stone-600" : "dark:text-white"
                                                    )}>{guru.name}</h4>
                                                    <p className={clsx(
                                                        "text-sm font-medium mb-1",
                                                        isGreyedOut ? "text-stone-300 dark:text-stone-700" : "text-stone-500 dark:text-stone-400"
                                                    )}>{guru.title}</p>
                                                    <p className={clsx(
                                                        "text-sm",
                                                        isGreyedOut ? "text-stone-300 dark:text-stone-700" : "text-stone-600 dark:text-stone-300"
                                                    )}>{guru.description}</p>

                                                    {/* Status badges */}
                                                    {allIntakesComplete && isCompleted && (
                                                        <div className="mt-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full text-xs font-medium">
                                                                <Sparkles size={14} /> Get Daily Guidance
                                                            </span>
                                                        </div>
                                                    )}
                                                    {inIntakeMode && isSelected && (
                                                        <div className="mt-3">
                                                            {isCompleted ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                                                    <CheckCircle size={14} /> Intake Complete
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
                                                                    <MessageCircle size={14} /> Start Intake
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && !inIntakeMode && (
                                                    <div className="absolute top-4 right-4 text-amber-500">
                                                        <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                                                            ✓
                                                        </div>
                                                    </div>
                                                )}
                                                {isSelected && isCompleted && (
                                                    <div className="absolute top-4 right-4">
                                                        <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                            <CheckCircle size={14} />
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
                                {inIntakeMode ? (
                                    <span>{completedIntakes.filter(id => selectedGurus.includes(id)).length} / {selectedGurus.length} intakes complete</span>
                                ) : (
                                    <span>{selectedGurus.length} Gurus selected</span>
                                )}
                            </div>
                            {allIntakesComplete ? (
                                <button
                                    onClick={() => navigate('/garden')}
                                    className="px-6 py-2 rounded-full font-bold transition-colors bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20"
                                >
                                    Go to Garden →
                                </button>
                            ) : (
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
                                    {inIntakeMode ? "Continue Intake →" : "Start Journey →"}
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

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
                {showAlignment && (
                    <DailyAlignmentModal
                        isOpen={showAlignment}
                        onClose={() => setShowAlignment(false)}
                    />
                )}
                {dailyGuidanceGuru && (
                    <GuruDailyGuidance
                        isOpen={!!dailyGuidanceGuru}
                        onClose={() => setDailyGuidanceGuru(null)}
                        guruId={dailyGuidanceGuru}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
