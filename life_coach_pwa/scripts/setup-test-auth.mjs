#!/usr/bin/env node
/**
 * Configure Convex env for the non-Clerk test auth backdoor.
 *
 * Usage:
 *   node scripts/setup-test-auth.mjs              # print env values
 *   node scripts/setup-test-auth.mjs --apply       # npx convex env set ...
 *   node scripts/setup-test-auth.mjs --secret 'my-secret'
 *
 * Requires .test-keys/private_b64.txt (from openssl generation).
 */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const keyPath = join(root, '.test-keys', 'private_b64.txt');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const secretIdx = args.indexOf('--secret');
const secret =
  secretIdx >= 0
    ? args[secretIdx + 1]
    : process.env.TEST_AUTH_SECRET || `vedicas-test-${randomBytes(8).toString('hex')}`;

// Resolve deployment site URL from .env.local
function readConvexCloudUrl() {
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    const m = text.match(/^VITE_CONVEX_URL=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.VITE_CONVEX_URL || '';
}

const cloudUrl = readConvexCloudUrl();
if (!cloudUrl) {
  console.error('Could not find VITE_CONVEX_URL in .env.local');
  process.exit(1);
}

const siteUrl = cloudUrl.replace('.convex.cloud', '.convex.site').replace(/\/$/, '');

if (!existsSync(keyPath)) {
  console.error(`Missing ${keyPath}. Generate keys first.`);
  process.exit(1);
}

const privateB64 = readFileSync(keyPath, 'utf8').trim();

const env = {
  TEST_AUTH_SECRET: secret,
  TEST_JWT_PRIVATE_KEY_B64: privateB64,
  TEST_AUTH_ISSUER: siteUrl,
  TEST_AUTH_JWKS_URL: `${siteUrl}/.well-known/jwks.json`,
};

console.log('# Test auth env for Convex\n');
for (const [k, v] of Object.entries(env)) {
  const display = k.includes('PRIVATE') ? `${v.slice(0, 24)}… (${v.length} chars)` : v;
  console.log(`${k}=${display}`);
}

console.log('\n# Full values (for copy/paste):\n');
for (const [k, v] of Object.entries(env)) {
  console.log(`export ${k}='${v}'`);
}

if (apply) {
  console.log('\n# Applying via npx convex env set …\n');
  for (const [k, v] of Object.entries(env)) {
    console.log(`Setting ${k}…`);
    execSync(`npx convex env set ${k} ${JSON.stringify(v)}`, {
      cwd: root,
      stdio: 'inherit',
    });
  }
  console.log('\nDone. Redeploy/push Convex if needed: npx convex dev');
  console.log(`Then open /dev-login and use secret: ${secret}`);
} else {
  console.log('\n# To apply to your Convex deployment:');
  console.log('node scripts/setup-test-auth.mjs --apply');
  console.log('# or pass a fixed secret:');
  console.log("node scripts/setup-test-auth.mjs --apply --secret 'your-shared-secret'");
}
