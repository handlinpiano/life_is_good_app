import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';

export default function ProtectedRoute({ children, requireChart = false }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAuthenticated: convexAuthed } = useConvexAuth();
  const storeChart = useStore((state) => state.chart);

  // Single source of truth for "has chart": Convex profile (with store as optimistic cache)
  const profile = useQuery(
    api.profiles.get,
    convexAuthed ? {} : 'skip'
  );

  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const profileLoading = convexAuthed && profile === undefined;
  const stillLoading = (authLoading || profileLoading) && showLoading;

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      queueMicrotask(() => setShowLoading(false));
    }
  }, [authLoading, profileLoading]);

  if (stillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse text-amber-800 dark:text-amber-200 text-xl font-bold">
            Connecting to the stars...
          </div>
          <div className="text-sm text-stone-500">
            Taking longer than expected?{' '}
            <button
              onClick={() => window.location.reload()}
              className="underline hover:text-stone-800"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const hasChart = Boolean(profile?.chartData || storeChart);

  if (requireChart && !hasChart) {
    return <Navigate to="/birth-chart" replace />;
  }

  return children;
}
