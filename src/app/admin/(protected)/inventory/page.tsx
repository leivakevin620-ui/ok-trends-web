import { loadCatalogSnapshot } from "@/lib/data/catalog-repository";

function inventoryState(stock: number | null) {
  if (stock === null) return { label: "Sin confirmar", className: "pending" };
  if (stock === 0) return { label: "Agotado", className: "warning" };
  if (stock <= 4) return { label: "Stock bajo", className: "warning" };
  return { label: "Disponible", className: "" };
}

export default async function AdminInventoryPage() {
  const catalog = await loadCatalogSnapshot();

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">CONTROL DE EXISTENCIAS</span>
          <h1>Inventario</h1>
        </div>
        <span className="admin-status-badge">Solo lectura</span>
      </header>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Disponibilidad registrada</h2>
            <p>Ningún ajuste cambia existencias reales en esta etapa.</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Producto</th><th>Unidades</th><th>Estado</th><th>Regla</th></tr>
            </thead>
            <tbody>
              {catalog.products
                .filter((product) => product.source === "verified")
                .map((product) => {
                  const state = inventoryState(product.stock);
                  return (
                    <tr key={product.id}>
                      <td>{product.name}<small>{product.slug}</small></td>
                      <td>{product.stock ?? "—"}</td>
                      <td><span className={`admin-pill ${state.className}`}>{state.label}</span></td>
                      <td>{product.stock === null ? "Requiere conteo físico" : "Dato comercial registrado"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <p className="admin-warning">
          Los movimientos de inventario usarán claves de idempotencia, auditoría y permisos. Los ajustes destructivos requerirán confirmación humana.
        </p>
      </section>
    </>
  );
}
