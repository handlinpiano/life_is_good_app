/**
 * Public JWKS for the test-auth JWT provider.
 * Private key lives only in Convex env TEST_JWT_PRIVATE_KEY_B64 (never commit).
 */
export const TEST_AUTH_KID = "vedicas-test-1";

export const TEST_JWKS = {
  keys: [
    {
      kty: "RSA",
      n: "jXLO-2Q568CY3me-xNrePHzmDFw9m3O-qahp50f2AF0CKoaq6eRZYtbJhajbhOD6NjrV2kEqBbBPqu8YW1eRSCMbFbkvjzLcYvvRKoszkexmfWM-xMNEMVk2XT6iiQ1Wgd5ZtWIvaw5APb1n34mYcxJO3AXwxdXK-ki_4F9HQ-HoJgu0qn-ETIIoQWYZRvcB4Xl7tL7bE4a9uAJV0kg7L31mOUg-6ALWPyluiGRuTtPe4Q9Kdhfn9J8c2KhaAzfo7kR-vk9WgquiAKMtWy4eotPvBCFany0JIDrjXcCWKvLp7mW4QbQLzVRwDCYDcl87aoj2-EQR7pMJTlL90_wkgQ",
      e: "AQAB",
      alg: "RS256",
      use: "sig",
      kid: TEST_AUTH_KID,
    },
  ],
};

/** Stable subject used as clerkId for the Playwright/test user */
export const TEST_USER_SUBJECT = "test_user_playwright";
