/**
 * Auth providers for Convex.
 * - Clerk: production user auth
 * - customJwt: optional test backdoor (only validates if TEST_AUTH_* env is set
 *   and tokens are minted via /test-auth/token)
 */
const providers: Array<Record<string, string>> = [
  {
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN as string,
    applicationID: "convex",
  },
];

// Test JWT provider — enable by setting both env vars in Convex dashboard
// (or `npx convex env set ...`). Issuer must match the JWT `iss` claim
// (typically https://<deployment>.convex.site).
if (process.env.TEST_AUTH_ISSUER && process.env.TEST_AUTH_JWKS_URL) {
  providers.push({
    type: "customJwt",
    applicationID: "convex",
    issuer: process.env.TEST_AUTH_ISSUER,
    jwks: process.env.TEST_AUTH_JWKS_URL,
    algorithm: "RS256",
  });
}

export default {
  providers,
};
