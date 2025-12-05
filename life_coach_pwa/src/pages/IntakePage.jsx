import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAstrology } from '../context/AstrologyContext';
import BirthForm from '../components/BirthForm';
import { motion } from 'framer-motion';

export default function IntakePage() {
    const { calculateBirthChart, loading, error, chart } = useAstrology();
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        const success = await calculateBirthChart(data);
        if (success) {
            navigate('/dashboard');
        }
    };

    // If we already have a chart, maybe redirect? Or allow re-entry.
    // For now, let them re-enter.

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-deco font-bold text-amber-900 dark:text-amber-100 mb-2">
                        Life Guru
                    </h1>
                    <p className="text-amber-800/80 dark:text-amber-200/80">
                        Let's start by understanding your cosmic blueprint.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-amber-100 dark:border-slate-700">
                    <BirthForm onSubmit={handleSubmit} loading={loading} />

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
