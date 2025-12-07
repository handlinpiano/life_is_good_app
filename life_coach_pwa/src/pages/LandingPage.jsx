import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Heart, Activity, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';

export default function LandingPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const chart = useStore(state => state.chart);

    // Redirect authenticated users appropriately (but don't block render)
    useEffect(() => {
        if (!loading && user) {
            if (chart) {
                navigate('/dashboard');
            } else {
                navigate('/birth-chart');
            }
        }
    }, [user, chart, loading, navigate]);

    // Don't block landing page render - show it immediately
    // The redirect will happen automatically if user is logged in

    const features = [
        {
            icon: Moon,
            title: 'Personalized Birth Chart',
            description: 'Get your complete Vedic horoscope with all divisional charts (D1-D60)'
        },
        {
            icon: Sparkles,
            title: 'AI Guru Guidance',
            description: 'Chat with specialized guides who understand your unique cosmic blueprint'
        },
        {
            icon: Activity,
            title: 'Health & Wellness',
            description: 'Ayurvedic advice and yoga practices tailored to your constitution'
        },
        {
            icon: Heart,
            title: 'Relationship Insights',
            description: 'Compatibility analysis and guidance for love and partnerships'
        },
        {
            icon: Briefcase,
            title: 'Career Direction',
            description: 'Discover your dharma and optimal paths for professional growth'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 dark:from-amber-400 dark:via-orange-300 dark:to-rose-400 mb-6">
                            Vedicas
                        </h1>
                        <p className="text-2xl md:text-3xl text-amber-800/80 dark:text-amber-200/80 mb-4 font-light">
                            Your Vedic Astrology System for Life Alignment
                        </p>
                        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-12">
                            Discover your cosmic blueprint and receive personalized guidance from AI-powered Vedic gurus
                            who understand your unique chart and life path.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/auth?mode=signup')}
                                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2"
                            >
                                Get Started <ArrowRight size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/auth?mode=signin')}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-200 font-bold rounded-full shadow-lg border-2 border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-all"
                            >
                                Sign In
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto px-4 py-20">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-3xl font-bold text-center text-stone-800 dark:text-stone-100 mb-16"
                >
                    Ancient Wisdom Meets Modern Technology
                </motion.h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-amber-100 dark:border-slate-700"
                        >
                            <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                                <feature.icon className="text-amber-700 dark:text-amber-400" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-stone-600 dark:text-stone-400">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-slate-800 dark:to-indigo-900/50 py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-stone-800 dark:text-stone-100 mb-12">
                        How It Works
                    </h2>

                    <div className="space-y-8">
                        {[
                            { step: '1', title: 'Create Your Account', desc: 'Sign up to save your data securely across all devices' },
                            { step: '2', title: 'Enter Your Birth Details', desc: 'Provide your birth date, time, and location for accurate chart calculation' },
                            { step: '3', title: 'Receive Your Chart', desc: 'Get your complete Vedic horoscope with all divisional charts' },
                            { step: '4', title: 'Chat with Your Gurus', desc: 'Consult AI guides who understand your chart and provide personalized advice' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-6"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                                        {item.title}
                                    </h3>
                                    <p className="text-stone-600 dark:text-stone-400">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
                        Ready to Discover Your Path?
                    </h2>
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-8">
                        Join Vedicas and unlock the wisdom of the stars.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/auth?mode=signup')}
                        className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-full shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all text-lg"
                    >
                        Begin Your Journey
                    </motion.button>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="border-t border-amber-200 dark:border-slate-700 py-8">
                <div className="max-w-6xl mx-auto px-4 text-center text-stone-500 dark:text-stone-400 text-sm">
                    <p>Vedicas - Vedic Wisdom for Modern Life</p>
                </div>
            </footer>
        </div>
    );
}
