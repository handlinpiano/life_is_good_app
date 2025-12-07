import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BirthForm from '../components/BirthForm';
import SyncStatus from '../components/AuthGuard';

export default function IntakePage() {
    const updateUser = useStore(state => state.updateUser);
    const calculateBirthChart = useStore(state => state.calculateBirthChart);
    const loading = useStore(state => state.loading);
    const error = useStore(state => state.error);
    const chart = useStore(state => state.chart);

    const { user: authUser, syncToCloud } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if user already has chart data
    useEffect(() => {
        if (chart) {
            navigate('/dashboard');
        }
    }, [chart, navigate]);

    const handleSubmit = async (data) => {
        const { name, gender, relationshipStatus, sexualOrientation, profession, ...birthParams } = data;

        // Build the birthData object that gurus need
        const birthData = {
            date: `${birthParams.year}-${String(birthParams.month).padStart(2, '0')}-${String(birthParams.day).padStart(2, '0')}`,
            time: `${String(birthParams.hour).padStart(2, '0')}:${String(birthParams.minute).padStart(2, '0')}`,
            latitude: birthParams.latitude,
            longitude: birthParams.longitude
        };

        // Update user profile in store with all data including birthData
        updateUser({
            name,
            gender,
            relationshipStatus,
            sexualOrientation,
            profession,
            birthDate: birthData.date,
            birthTime: birthData.time,
            birthPlace: birthParams.birthPlace,
            latitude: birthParams.latitude,
            longitude: birthParams.longitude,
            birthData // The nested object gurus need
        });

        // Calculate chart
        const success = await calculateBirthChart(birthParams);

        if (success) {
            // Sync everything to cloud immediately after chart calculation
            const saveResult = await syncToCloud();

            if (saveResult?.success) {
                navigate('/dashboard');
            } else {
                // Determine if it was an offline error or something else
                const isOffline = !navigator.onLine; // Simple browser check
                if (isOffline) {
                    // If offline, we still let them in because local persist works
                    console.warn('Offline save failed, but proceeding locally');
                    navigate('/dashboard');
                } else {
                    alert('Failed to save your chart to the cloud. Please try again.');
                }
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                        Your Birth Details
                    </h1>
                    <p className="text-amber-800/80 dark:text-amber-200/80">
                        Enter your birth information to generate your Vedic chart
                    </p>
                    <div className="mt-4 flex justify-center">
                        <SyncStatus />
                    </div>
                    {authUser && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
                            Signed in as {authUser.email}
                        </p>
                    )}
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
