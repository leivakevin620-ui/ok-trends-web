import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url()]).optional();
const optionalText = z.string().optional();

const ServerEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalText,
  ADMIN_BOOTSTRAP_PASSWORD: optionalText,
  ADMIN_SESSION_SECRET: optionalText,
  AI_PROVIDER: optionalText,
});

export interface ServerConfiguration {
  readonly supabaseUrl: string | null;
  readonly supabasePublishableKey: string | null;
  readonly adminBootstrapPassword: string | null;
  readonly adminSessionSecret: string | null;
  readonly aiProvider: string;
}

export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

function clean(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getServerConfiguration(
  environment: EnvironmentSource = process.env,
): ServerConfiguration {
  const parsed = ServerEnvironmentSchema.parse(environment);

  return {
    supabaseUrl: clean(parsed.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: clean(parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    adminBootstrapPassword: clean(parsed.ADMIN_BOOTSTRAP_PASSWORD),
    adminSessionSecret: clean(parsed.ADMIN_SESSION_SECRET),
    aiProvider: clean(parsed.AI_PROVIDER) ?? "simulation",
  };
}

export function isSupabaseConfigured(configuration: ServerConfiguration): boolean {
  return Boolean(configuration.supabaseUrl && configuration.supabasePublishableKey);
}

export function isAdminBootstrapConfigured(
  configuration: ServerConfiguration,
): boolean {
  return Boolean(
    configuration.adminBootstrapPassword &&
      configuration.adminBootstrapPassword.length >= 12 &&
      configuration.adminSessionSecret &&
      configuration.adminSessionSecret.length >= 32,
  );
}
