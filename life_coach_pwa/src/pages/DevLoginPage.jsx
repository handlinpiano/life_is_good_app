import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical, Loader2 } from 'lucide-react';
import {
  fetchTestAuthStatus,
  isTestAuthActive,
  isTestAuthRouteEnabled,
  mintTestToken,
} from '../lib/testAuth';

/**
 * Non-Clerk test login for Playwright / agent browser testing.
 * Only useful when Convex has TEST_AUTH_SECRET configured.
 */
export default function DevLoginPage() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [name, setName] = useState('Playwright Tester');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ enabled: null });

  useEffect(() => {
    if (!isTestAuthRouteEnabled()) {
      navigate('/', { replace: true });
      return;
    }
    if (isTestAuthActive()) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchTestAuthStatus().then(setStatus);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await mintTestToken(secret.trim(), name.trim() || 'Playwright Tester');
      // Full reload so Root switches from Clerk → test Convex provider
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  if (!isTestAuthRouteEnabled()) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-amber-50 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-amber-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <FlaskConical size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                Test login
              </h1>
              <p className="text-xs text-stone-500">
                Non-Clerk backdoor for automation
              </p>
            </div>
          </div>

          {status.enabled === false && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Test auth is <strong>not configured</strong> on Convex yet. Set{' '}
              <code className="text-xs">TEST_AUTH_SECRET</code>,{' '}
              <code className="text-xs">TEST_JWT_PRIVATE_KEY_B64</code>,{' '}
              <code className="text-xs">TEST_AUTH_ISSUER</code>, and{' '}
              <code className="text-xs">TEST_AUTH_JWKS_URL</code> — see{' '}
              <code className="text-xs">scripts/setup-test-auth.mjs</code>.
            </div>
          )}

          {status.enabled === true && (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
              Server backdoor is enabled. Enter the shared secret to continue.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Test secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono"
                placeholder="TEST_AUTH_SECRET"
                required
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                'Enter as test user'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-stone-400 leading-relaxed">
            User id: <code>test_user_playwright</code>. Data is real Convex rows
            for that subject — safe for e2e, not for production end-users.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
