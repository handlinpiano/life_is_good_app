import { useAuth } from '../contexts/AuthContext';
import { Cloud, Loader2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Lightweight signed-in status badge for intake / settings.
 * Manual bulk-sync was removed — entities write to Convex directly.
 */
export default function SyncStatus({ className }) {
  const { user, isAuthenticated, profileReady } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full',
        'bg-emerald-50 text-emerald-800 border border-emerald-200',
        'dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
        className
      )}
    >
      {!profileReady ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Cloud size={14} />
      )}
      <span>
        {user?.email ? `Signed in as ${user.email}` : 'Signed in · synced'}
      </span>
    </div>
  );
}
