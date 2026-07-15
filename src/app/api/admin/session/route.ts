import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
} from "@/lib/auth/admin-session";
import {
  getServerConfiguration,
  isAdminBootstrapConfigured,
} from "@/lib/server-env";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  password: z.string().min(1).max(256),
});

interface AttemptState {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptState>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getClientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function consumeAttempt(key: string, now = Date.now()): boolean {
  const current = attempts.get(key);

  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

function secureEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export async function POST(request: Request) {
  const configuration = getServerConfiguration();

  if (!isAdminBootstrapConfigured(configuration)) {
    return NextResponse.json(
      {
        code: "ADMIN_NOT_CONFIGURED",
        message: "El acceso administrativo todavía no está configurado.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const clientKey = getClientKey(request);
  if (!consumeAttempt(clientKey)) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: "Demasiados intentos. Espera 15 minutos antes de volver a intentar.",
      },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } },
    );
  }

  let body: z.infer<typeof LoginSchema>;
  try {
    body = LoginSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Solicitud de acceso inválida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const expectedPassword = configuration.adminBootstrapPassword;
  const sessionSecret = configuration.adminSessionSecret;

  if (!expectedPassword || !sessionSecret || !secureEqual(body.password, expectedPassword)) {
    return NextResponse.json(
      { code: "INVALID_CREDENTIALS", message: "Credenciales incorrectas." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  attempts.delete(clientKey);
  const response = NextResponse.json(
    { status: "authenticated", redirectTo: "/admin" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(sessionSecret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}

export function DELETE() {
  const response = NextResponse.json(
    { status: "signed_out" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
