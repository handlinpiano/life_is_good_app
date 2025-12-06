import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import BirthForm from '../components/BirthForm';

export default function IntakePage() {
    const updateUser = useStore(state => state.updateUser);
    const calculateBirthChart = useStore(state => state.calculateBirthChart);
    const loading = useStore(state => state.loading);
    const error = useStore(state => state.error);

    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        const { name, gender, relationshipStatus, sexualOrientation, profession, ...birthParams } = data;

        // Update user profile in store
        updateUser({ name, gender, relationshipStatus, sexualOrientation, profession });

        // Calculate chart
        const success = await calculateBirthChart(birthParams);

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
                        Vedicas
                    </h1>
                    <p className="text-amber-800/80 dark:text-amber-200/80">
                        Your Vedic Astrology System for life alignment.
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
