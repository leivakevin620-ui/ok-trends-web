import { describe, expect, it } from "vitest";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "../src/lib/auth/admin-session";
import {
  getServerConfiguration,
  isAdminBootstrapConfigured,
  isSupabaseConfigured,
} from "../src/lib/server-env";

const secret = "a-secure-test-secret-with-more-than-32-characters";

describe("admin session", () => {
  it("creates and verifies a signed owner session", () => {
    const token = createAdminSessionToken(secret, 1_000);
    const session = verifyAdminSessionToken(token, secret, 1_001);

    expect(session).toMatchObject({
      subject: "owner",
      role: "owner",
      tenantSlug: "o-k-trends",
    });
  });

  it("rejects tampered, expired and incorrectly signed tokens", () => {
    const token = createAdminSessionToken(secret, 1_000);
    const [payload, signature] = token.split(".");

    expect(verifyAdminSessionToken(`${payload}x.${signature}`, secret, 1_001)).toBeNull();
    expect(verifyAdminSessionToken(token, `${secret}-wrong`, 1_001)).toBeNull();
    expect(verifyAdminSessionToken(token, secret, 1_000 + 8 * 60 * 60 + 1)).toBeNull();
  });

  it("requires a sufficiently long session secret", () => {
    expect(() => createAdminSessionToken("short", 1_000)).toThrow();
  });
});

describe("server configuration", () => {
  it("keeps external integrations disabled when credentials are empty", () => {
    const configuration = getServerConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      ADMIN_BOOTSTRAP_PASSWORD: "",
      ADMIN_SESSION_SECRET: "",
    });

    expect(isSupabaseConfigured(configuration)).toBe(false);
    expect(isAdminBootstrapConfigured(configuration)).toBe(false);
    expect(configuration.aiProvider).toBe("simulation");
  });

  it("enables bootstrap admin only with strong server-only values", () => {
    const configuration = getServerConfiguration({
      ADMIN_BOOTSTRAP_PASSWORD: "a-password-with-12-chars",
      ADMIN_SESSION_SECRET: secret,
    });

    expect(isAdminBootstrapConfigured(configuration)).toBe(true);
  });

  it("requires both Supabase public values before enabling the adapter", () => {
    const incomplete = getServerConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    });

    const complete = getServerConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
    });

    expect(isSupabaseConfigured(incomplete)).toBe(false);
    expect(isSupabaseConfigured(complete)).toBe(true);
  });
});
