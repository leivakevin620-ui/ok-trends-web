import { NextResponse } from "next/server";
import {
  getServerConfiguration,
  isAdminBootstrapConfigured,
  isSupabaseConfigured,
} from "@/lib/server-env";

export const dynamic = "force-dynamic";

export function GET() {
  const configuration = getServerConfiguration();

  return NextResponse.json(
    {
      status: "ok",
      service: "ok-trends-store",
      version: "0.1.0",
      database: isSupabaseConfigured(configuration) ? "configured" : "pending",
      admin: isAdminBootstrapConfigured(configuration) ? "configured" : "pending",
      mode: configuration.aiProvider,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
