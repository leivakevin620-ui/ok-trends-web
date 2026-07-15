import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ok-trends-store",
      version: "0.1.0",
      database: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "pending",
      mode: process.env.AI_PROVIDER ?? "simulation",
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
