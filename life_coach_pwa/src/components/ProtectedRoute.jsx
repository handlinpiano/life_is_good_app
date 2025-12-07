import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';

export default function ProtectedRoute({ children, requireChart = false }) {
    const { isAuthenticated, loading } = useAuth();
    const chart = useStore(state => state.chart);

    const [showLoading, setShowLoading] = useState(true);

    useEffect(() => {
        // Fail-safe: Force stop loading after 5 seconds if auth hangs
        const timer = setTimeout(() => setShowLoading(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Also stop showing loading if actual loading finishes
    useEffect(() => {
        if (!loading) {
            // Use a microtask to avoid cascading renders
            queueMicrotask(() => setShowLoading(false));
        }
    }, [loading]);

    if (loading && showLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-pulse text-amber-800 dark:text-amber-200 text-xl font-bold">Connecting to the stars...</div>
                    <div className="text-sm text-stone-500">Taking longer than expected? <button onClick={() => window.location.reload()} className="underline hover:text-stone-800">Reload</button></div>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to landing
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Authenticated but no chart yet - redirect to birth chart entry
    // (unless we're already on the birth-chart page)
    if (requireChart && !chart) {
        return <Navigate to="/birth-chart" replace />;
    }

    return children;
}
