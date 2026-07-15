import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  getServerConfiguration,
  isAdminBootstrapConfigured,
} from "@/lib/server-env";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = isAdminBootstrapConfigured(getServerConfiguration());

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-brand" href="/">
          <span className="admin-brand-mark">O&K</span>
          <span>
            <strong>O&K Trends</strong>
            <small>Administración protegida</small>
          </span>
        </Link>

        <h1>Acceso del propietario</h1>
        <p>
          Este panel administra catálogo e inventario. La sesión usa una cookie firmada,
          HttpOnly y de duración limitada.
        </p>

        <AdminLoginForm configured={configured} />

        <p className="admin-config-note">
          {configured
            ? "El acceso de arranque está activo. Supabase Auth reemplazará este mecanismo cuando exista un proyecto exclusivo para O&K Trends."
            : "Acceso bloqueado: configura ADMIN_BOOTSTRAP_PASSWORD y ADMIN_SESSION_SECRET en el entorno del servidor. No escribas esos valores en el repositorio."}
        </p>
      </section>
    </main>
  );
}
