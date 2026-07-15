import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";
import { getServerConfiguration } from "@/lib/server-env";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const configuration = getServerConfiguration();
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    configuration.adminSessionSecret ?? "",
  );

  if (!session) redirect("/admin/login");

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link className="admin-brand" href="/admin">
            <span className="admin-brand-mark">O&K</span>
            <span>
              <strong>O&K Trends</strong>
              <small>Panel del propietario</small>
            </span>
          </Link>

          <nav className="admin-nav" aria-label="Administración">
            <Link href="/admin">Resumen</Link>
            <Link href="/admin/products">Productos</Link>
            <Link href="/admin/inventory">Inventario</Link>
            <Link href="/">Ver tienda</Link>
          </nav>

          <div className="admin-sidebar-footer">
            <small>
              Sesión local firmada. Las escrituras siguen bloqueadas hasta conectar Supabase Auth y RLS.
            </small>
            <AdminLogoutButton />
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
