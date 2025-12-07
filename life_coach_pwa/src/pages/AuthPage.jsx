import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') === 'signin' ? 'signin' : 'signup';

    const { isAuthenticated } = useAuth();
    const chart = useStore(state => state.chart);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            if (chart) {
                navigate('/dashboard');
            } else {
                navigate('/birth-chart');
            }
        }
    }, [isAuthenticated, chart, navigate]);

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
                    Back to Home
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                        Vedicas
                    </h1>
                    <p className="text-amber-800/80 dark:text-amber-200/80">
                        {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
                    </p>
                </div>

                <div className="flex justify-center">
                    {mode === 'signin' ? (
                        <SignIn
                            routing="hash"
                            signUpUrl="/auth?mode=signup"
                            afterSignInUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto",
                                    card: "bg-white dark:bg-slate-800 shadow-xl border border-amber-100 dark:border-slate-700",
                                    headerTitle: "text-amber-900 dark:text-amber-100",
                                    headerSubtitle: "text-amber-800/80 dark:text-amber-200/80",
                                    formButtonPrimary: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
                                    footerActionLink: "text-amber-600 hover:text-amber-700"
                                }
                            }}
                        />
                    ) : (
                        <SignUp
                            routing="hash"
                            signInUrl="/auth?mode=signin"
                            afterSignUpUrl="/birth-chart"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto",
                                    card: "bg-white dark:bg-slate-800 shadow-xl border border-amber-100 dark:border-slate-700",
                                    headerTitle: "text-amber-900 dark:text-amber-100",
                                    headerSubtitle: "text-amber-800/80 dark:text-amber-200/80",
                                    formButtonPrimary: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
                                    footerActionLink: "text-amber-600 hover:text-amber-700"
                                }
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
