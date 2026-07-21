import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { SignJWT, importPKCS8 } from "jose";
import { TEST_AUTH_KID, TEST_JWKS, TEST_USER_SUBJECT } from "./testAuthKeys";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Public JWKS — required for Convex to validate test JWTs */
http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify(TEST_JWKS), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

/**
 * Mint a short-lived test JWT.
 * Disabled unless TEST_AUTH_SECRET + TEST_JWT_PRIVATE_KEY_B64 are set in Convex env.
 *
 * POST { "secret": "...", "name"?: "Playwright Tester" }
 */
http.route({
  path: "/test-auth/token",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const secret = process.env.TEST_AUTH_SECRET;
    const privateKeyB64 = process.env.TEST_JWT_PRIVATE_KEY_B64;

    if (!secret || !privateKeyB64) {
      return new Response(
        JSON.stringify({
          error: "Test auth is not configured on this deployment",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let body: { secret?: string; name?: string; subject?: string } = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!body.secret || body.secret !== secret) {
      return new Response(JSON.stringify({ error: "Invalid secret" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const issuer =
      process.env.TEST_AUTH_ISSUER || new URL(request.url).origin;
    const subject = body.subject || TEST_USER_SUBJECT;
    const name = body.name || "Playwright Tester";

    try {
      const pem = atob(privateKeyB64);
      const key = await importPKCS8(pem, "RS256");
      const now = Math.floor(Date.now() / 1000);

      const token = await new SignJWT({
        name,
        email: "playwright@test.vedicas.local",
      })
        .setProtectedHeader({ alg: "RS256", kid: TEST_AUTH_KID })
        .setSubject(subject)
        .setIssuer(issuer)
        .setAudience("convex")
        .setIssuedAt(now)
        .setExpirationTime(now + 60 * 60 * 12) // 12 hours
        .sign(key);

      return new Response(
        JSON.stringify({
          token,
          subject,
          name,
          email: "playwright@test.vedicas.local",
          expiresIn: 60 * 60 * 12,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (err) {
      console.error("[test-auth] Failed to mint token", err);
      return new Response(JSON.stringify({ error: "Failed to mint token" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }),
});

http.route({
  path: "/test-auth/token",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

/** Health / discovery for the backdoor */
http.route({
  path: "/test-auth/status",
  method: "GET",
  handler: httpAction(async () => {
    const configured = Boolean(
      process.env.TEST_AUTH_SECRET && process.env.TEST_JWT_PRIVATE_KEY_B64
    );
    return new Response(
      JSON.stringify({
        enabled: configured,
        subject: configured ? TEST_USER_SUBJECT : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }),
});

export default http;
