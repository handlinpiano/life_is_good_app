/**
 * Dev / Playwright test auth (non-Clerk backdoor).
 *
 * Flow:
 * 1. Open /dev-login, enter TEST_AUTH_SECRET
 * 2. Frontend POSTs to Convex site /test-auth/token
 * 3. JWT stored in sessionStorage; ConvexProviderWithAuth uses it
 * 4. Convex validates JWT via customJwt + JWKS
 *
 * Disabled when mint endpoint is not configured (no secret/private key on Convex).
 */

const STORAGE_KEY = 'vedicas_test_auth';

export const TEST_USER_DEFAULTS = {
  id: 'test_user_playwright',
  email: 'playwright@test.vedicas.local',
  name: 'Playwright Tester',
};

/** Convert https://xxx.convex.cloud → https://xxx.convex.site */
export function getConvexSiteUrl() {
  const cloud = import.meta.env.VITE_CONVEX_URL || '';
  if (!cloud) return '';
  return cloud.replace('.convex.cloud', '.convex.site').replace(/\/$/, '');
}

export function isTestAuthActive() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return Boolean(data?.token && data?.secret);
  } catch {
    return false;
  }
}

export function getTestAuthSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTestAuthSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function mintTestToken(secret, name) {
  const site = getConvexSiteUrl();
  if (!site) throw new Error('VITE_CONVEX_URL is not set');

  const res = await fetch(`${site}/test-auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      name: name || TEST_USER_DEFAULTS.name,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Token mint failed (${res.status})`);
  }

  const session = {
    token: data.token,
    secret,
    subject: data.subject || TEST_USER_DEFAULTS.id,
    name: data.name || name || TEST_USER_DEFAULTS.name,
    email: data.email || TEST_USER_DEFAULTS.email,
    mintedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/** Refresh JWT using stored secret (for Convex fetchAccessToken). */
export async function refreshTestToken() {
  const session = getTestAuthSession();
  if (!session?.secret) return null;
  try {
    const next = await mintTestToken(session.secret, session.name);
    return next.token;
  } catch (err) {
    console.error('[testAuth] refresh failed', err);
    clearTestAuthSession();
    return null;
  }
}

export async function fetchTestAuthStatus() {
  const site = getConvexSiteUrl();
  if (!site) return { enabled: false };
  try {
    const res = await fetch(`${site}/test-auth/status`);
    if (!res.ok) return { enabled: false };
    return await res.json();
  } catch {
    return { enabled: false };
  }
}

/** Whether the /dev-login route should be available in this build */
export function isTestAuthRouteEnabled() {
  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_TEST_AUTH === 'true'
  );
}
