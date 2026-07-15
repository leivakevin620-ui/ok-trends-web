import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const ADMIN_SESSION_COOKIE = "ok_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

const SessionPayloadSchema = z.object({
  version: z.literal(1),
  subject: z.literal("owner"),
  tenantSlug: z.literal("o-k-trends"),
  role: z.literal("owner"),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
});

export type AdminSession = z.infer<typeof SessionPayloadSchema>;

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(
  secret: string,
  currentTimeSeconds = Math.floor(Date.now() / 1000),
): string {
  if (secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }

  const session: AdminSession = {
    version: 1,
    subject: "owner",
    tenantSlug: "o-k-trends",
    role: "owner",
    issuedAt: currentTimeSeconds,
    expiresAt: currentTimeSeconds + ADMIN_SESSION_TTL_SECONDS,
  };

  const encodedPayload = encode(JSON.stringify(session));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
  secret: string,
  currentTimeSeconds = Math.floor(Date.now() / 1000),
): AdminSession | null {
  if (!token || secret.length < 32) return null;

  const [encodedPayload, suppliedSignature, ...rest] = token.split(".");
  if (!encodedPayload || !suppliedSignature || rest.length > 0) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const supplied = Buffer.from(suppliedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const session = SessionPayloadSchema.parse(JSON.parse(decode(encodedPayload)));
    if (session.expiresAt <= currentTimeSeconds || session.issuedAt > currentTimeSeconds + 60) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
