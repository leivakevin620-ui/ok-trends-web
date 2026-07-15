import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";
import { loadCatalogSnapshot, summarizeInventory } from "@/lib/data/catalog-repository";
import { getServerConfiguration, isAdminBootstrapConfigured } from "@/lib/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = getServerConfiguration();
  const cookieStore = await cookies();
  const sessionSecret = configuration.adminSessionSecret ?? "";
  const session = verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    sessionSecret,
  );

  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sesión administrativa requerida." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const catalog = await loadCatalogSnapshot(configuration);

  return NextResponse.json(
    {
      status: "ok",
      adminMode: isAdminBootstrapConfigured(configuration) ? "bootstrap" : "disabled",
      catalogSource: catalog.source,
      inventory: summarizeInventory(catalog),
      warning: catalog.warning,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
