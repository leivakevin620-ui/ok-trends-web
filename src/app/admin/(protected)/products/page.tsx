import { formatCop } from "@/lib/currency";
import { loadCatalogSnapshot } from "@/lib/data/catalog-repository";

export default async function AdminProductsPage() {
  const catalog = await loadCatalogSnapshot();

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">CATÁLOGO</span>
          <h1>Productos</h1>
        </div>
        <span className="admin-status-badge">Fuente: {catalog.source}</span>
      </header>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Catálogo operativo</h2>
            <p>Los datos sin confirmar permanecen bloqueados para compra.</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {catalog.products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.name}
                    <small>{product.slug}</small>
                  </td>
                  <td>{product.categoryId}</td>
                  <td>{formatCop(product.priceCop)}</td>
                  <td>{product.stock === null ? "Por confirmar" : product.stock}</td>
                  <td>
                    <span className={`admin-pill ${product.source === "placeholder" ? "pending" : ""}`}>
                      {product.source === "verified" ? "Verificado" : "Borrador"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="admin-warning">
          La edición permanece deshabilitada hasta aplicar la migración de Supabase, crear el usuario propietario y validar las políticas RLS.
        </p>
      </section>
    </>
  );
}
