import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Cloud, CloudOff, LogIn, UserPlus, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

function AuthModal({ isOpen, onClose }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, name);
                if (error) {
                    setError(error.message);
                } else {
                    onClose();
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    onClose();
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 my-auto">
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    <Cloud className="text-blue-500" size={24} />
                    {isSignUp ? 'Join Family' : 'Sign In'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                    {isSignUp
                        ? 'Create an account to sync your data across all devices.'
                        : 'Sign in to sync your wisdom, seeds, and charts.'}
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            minLength={6}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-stone-500 hover:text-stone-700 dark:text-stone-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isSignUp ? (
                                <><UserPlus size={18} /> Sign Up</>
                            ) : (
                                <><LogIn size={18} /> Sign In</>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-amber-600 hover:underline"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function SyncStatus() {
    const [showModal, setShowModal] = useState(false);
    const { user, isOnline, syncing, signOut, syncToCloud } = useAuth();

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
                <CloudOff size={16} />
                <span>Offline</span>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                    <Cloud size={16} />
                    <span>Sync</span>
                </button>
                {showModal && <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />}
            </>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={syncToCloud}
                disabled={syncing}
                className={clsx(
                    "flex items-center gap-1 text-sm",
                    syncing ? "text-blue-400" : "text-green-500 hover:text-green-600"
                )}
                title="Sync to cloud"
            >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            </button>
            <div className="flex items-center gap-2 text-sm text-stone-500">
                <Cloud size={16} className="text-green-500" />
                <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
            </div>
            <button
                onClick={signOut}
                className="text-xs text-stone-400 hover:text-stone-600"
            >
                Sign out
            </button>
        </div>
    );
}
