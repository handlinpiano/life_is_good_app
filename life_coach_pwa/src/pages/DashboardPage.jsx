import { useState, useEffect } from 'react';
import { useStore, SEED_DIFFICULTIES } from '../store';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ChevronUp, Heart, Briefcase, Sparkles, User, MapPin, Calendar, Clock, MessageCircle, Sprout, Timer } from 'lucide-react';
import NorthIndianChart from '../components/NorthIndianChart';
import DailyAlignmentModal from '../components/DailyAlignmentModal';
import PlanetTable from '../components/PlanetTable';
import DivisionalCharts from '../components/DivisionalCharts';
import Navbar from '../components/Navbar';
import { getLocalDateString } from '../utils/constants';

// Get time-appropriate greeting
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
    if (hour < 21) return { text: 'Good evening', emoji: '🌆' };
    return { text: 'Good night', emoji: '🌙' };
}

// Calculate time until midnight (local)
function getTimeUntilReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
}

export default function DashboardPage() {
    const user = useStore(state => state.user);
    const chart = useStore(state => state.chart);
    const { isAuthenticated } = useConvexAuth();

    const navigate = useNavigate();
    const [showBlueprint, setShowBlueprint] = useState(false);
    const [showAlignment, setShowAlignment] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
    const [greeting, setGreeting] = useState(getGreeting());

    // Get seeds from Convex
    const seeds = useQuery(api.seeds.list, isAuthenticated ? {} : "skip") || [];
    const today = getLocalDateString();

    // Calculate today's score
    let maxPossibleScore = 0;
    let currentScore = 0;
    seeds.forEach(seed => {
        const points = (SEED_DIFFICULTIES[seed.difficulty] || SEED_DIFFICULTIES.Medium).points;
        maxPossibleScore += points;
        if (seed.completedDates?.includes(today)) {
            currentScore += points;
        }
    });

    // Update timer every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeUntilReset(getTimeUntilReset());
            setGreeting(getGreeting());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!chart) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-stone-500">Please complete the intake first.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-900 pb-20">
            <Navbar />
            <div className="pt-16">
                {/* Welcome Card */}
                <header className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-b border-amber-100 dark:border-slate-700">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        {/* Greeting Row */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                                    {greeting.emoji} {greeting.text}, {user.name || 'Seeker'}
                                </h1>
                                <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-stone-500 dark:text-stone-400">{chart.D1?.ascendant?.sign} Rising</p>
                            </div>
                        </div>

                        {/* Seeds Progress Card */}
                        {seeds.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-amber-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Sprout className="text-green-600 dark:text-green-400" size={20} />
                                        <span className="font-semibold text-stone-700 dark:text-stone-200">Today's Garden</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm">
                                        <Timer size={14} />
                                        <span>Resets in {timeUntilReset.hours}h {timeUntilReset.minutes}m</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-3 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${maxPossibleScore > 0 ? (currentScore / maxPossibleScore) * 100 : 0}%` }}
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                {/* Score */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-stone-600 dark:text-stone-300">
                                        <span className="font-bold text-green-600 dark:text-green-400">{currentScore}</span>
                                        <span className="text-stone-400 dark:text-stone-500"> / {maxPossibleScore} pts</span>
                                    </span>
                                    <button
                                        onClick={() => navigate('/garden')}
                                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                                    >
                                        Water seeds →
                                    </button>
                                </div>
                            </div>
                        )}
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

                    {/* Profile Details Section */}
                    <div>
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-2 text-stone-500 hover:text-amber-600 font-medium w-full"
                        >
                            {showProfile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            <User size={18} />
                            {showProfile ? "Hide Birth Details" : "View Your Birth Details"}
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3">
                                                <User size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Name</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">{user.name || 'Not set'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <User size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Gender</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">{user.gender || 'Not set'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Calendar size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Birth Date</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">
                                                        {user.birthData?.date || 'Not set'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Clock size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Birth Time</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">
                                                        {(() => {
                                                            const time = user.birthData?.time;
                                                            if (!time) return 'Not set';
                                                            const [hours, minutes] = time.split(':').map(Number);
                                                            const ampm = hours >= 12 ? 'PM' : 'AM';
                                                            const displayHours = hours % 12 || 12;
                                                            return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 sm:col-span-2">
                                                <MapPin size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Birth Place</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">
                                                        {user.birthPlace || 'Not set'}
                                                    </p>
                                                    {user.birthData?.latitude && (
                                                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                                                            Lat: {user.birthData.latitude}, Long: {user.birthData.longitude}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Heart size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Relationship Status</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">{user.relationshipStatus || 'Not set'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Briefcase size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Profession</p>
                                                    <p className="font-medium text-stone-800 dark:text-stone-100">{user.profession || 'Not set'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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

                    {/* Chat with Guide */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/chat')}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <MessageCircle size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-xl">Chat with Your Guide</h3>
                                    <p className="text-white/80">Get personalized wisdom based on your chart</p>
                                </div>
                            </div>
                            <ChevronRight size={24} className="transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-stone-200 dark:border-stone-800 z-20">
                        <div className="max-w-4xl mx-auto flex justify-end items-center">
                            <button
                                onClick={() => navigate('/garden')}
                                className="px-6 py-2 rounded-full font-bold transition-colors bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20"
                            >
                                Go to Garden →
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {showAlignment && (
                    <DailyAlignmentModal
                        isOpen={showAlignment}
                        onClose={() => setShowAlignment(false)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
