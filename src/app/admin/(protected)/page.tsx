import { loadCatalogSnapshot, summarizeInventory } from "@/lib/data/catalog-repository";
import { getServerConfiguration, isSupabaseConfigured } from "@/lib/server-env";

export default async function AdminDashboardPage() {
  const configuration = getServerConfiguration();
  const catalog = await loadCatalogSnapshot(configuration);
  const inventory = summarizeInventory(catalog);

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">CENTRO DE OPERACIONES</span>
          <h1>Resumen de la tienda</h1>
        </div>
        <span className="admin-status-badge">
          {catalog.source === "supabase" ? "Supabase conectado" : "Modo seguro local"}
        </span>
      </header>

      <section className="admin-grid" aria-label="Indicadores principales">
        <article className="admin-card">
          <span>Productos visibles</span>
          <strong>{inventory.products}</strong>
        </article>
        <article className="admin-card">
          <span>Productos verificados</span>
          <strong>{inventory.verifiedProducts}</strong>
        </article>
        <article className="admin-card">
          <span>Unidades registradas</span>
          <strong>{inventory.totalUnits}</strong>
        </article>
        <article className="admin-card">
          <span>Alertas de inventario</span>
          <strong>{inventory.lowStock}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Estado operativo</h2>
            <p>Controles habilitados antes de permitir operaciones reales.</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Componente</th><th>Estado</th><th>Protección</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Acceso administrativo</td>
                <td><span className="admin-pill">Protegido</span></td>
                <td>Cookie HttpOnly firmada, vencimiento de 8 horas y límite de intentos.</td>
              </tr>
              <tr>
                <td>Catálogo</td>
                <td><span className="admin-pill">Lectura activa</span></td>
                <td>{catalog.source === "supabase" ? "RPC pública restringida por estado." : "Datos locales verificados con adaptador intercambiable."}</td>
              </tr>
              <tr>
                <td>Edición de productos</td>
                <td><span className="admin-pill pending">Bloqueada</span></td>
                <td>Se habilita únicamente con Supabase Auth, permisos y RLS aplicadas.</td>
              </tr>
              <tr>
                <td>Pagos y mensajería</td>
                <td><span className="admin-pill pending">Bloqueados</span></td>
                <td>Requieren proveedores oficiales, credenciales y pruebas independientes.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {!isSupabaseConfigured(configuration) || catalog.warning ? (
          <p className="admin-warning">
            {catalog.warning ?? "No existe un proyecto Supabase exclusivo configurado. El panel usa el catálogo local y no permite escrituras."}
          </p>
        ) : null}
      </section>
    </>
  );
}
