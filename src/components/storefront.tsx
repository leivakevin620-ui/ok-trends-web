"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  categories,
  products as seedProducts,
  type CategoryId,
  type StoreProduct,
} from "@/data/catalog";
import { formatCop } from "@/lib/currency";

const CART_STORAGE_KEY = "ok-trends-cart-v1";
const CART_CHANGE_EVENT = "ok-trends-cart-change";
const EMPTY_CART_SNAPSHOT = "{}";

type CartState = Readonly<Record<string, number>>;
type CartUpdater = (current: CartState) => CartState;

interface StorefrontProps {
  readonly initialProducts?: readonly StoreProduct[];
  readonly catalogSource?: "seed" | "supabase";
  readonly catalogWarning?: string | null;
}

function parseStoredCart(raw: string, productCatalog: readonly StoreProduct[]): CartState {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const safeCart: Record<string, number> = {};

    for (const [productId, quantity] of Object.entries(parsed)) {
      const numericQuantity = Number(quantity);
      const productExists = productCatalog.some((product) => product.id === productId);

      if (
        productExists &&
        Number.isInteger(numericQuantity) &&
        numericQuantity > 0 &&
        numericQuantity <= 20
      ) {
        safeCart[productId] = numericQuantity;
      }
    }

    return safeCart;
  } catch {
    return {};
  }
}

function subscribeToCart(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_CHANGE_EVENT, onStoreChange);
  };
}

function getCartSnapshot(): string {
  return window.localStorage.getItem(CART_STORAGE_KEY) ?? EMPTY_CART_SNAPSHOT;
}

function getServerCartSnapshot(): string {
  return EMPTY_CART_SNAPSHOT;
}

function persistCart(cart: CartState): void {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function Storefront({
  initialProducts = seedProducts,
  catalogSource = "seed",
  catalogWarning = null,
}: StorefrontProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [cartOpen, setCartOpen] = useState(false);

  const cartSnapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const cart = useMemo(
    () => parseStoredCart(cartSnapshot, initialProducts),
    [cartSnapshot, initialProducts],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return initialProducts.filter((product) => {
      const matchesCategory = category === "all" || product.categoryId === category;
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.description}`
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);

      return product.published && matchesCategory && matchesQuery;
    });
  }, [category, initialProducts, query]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = initialProducts.find((item) => item.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter(
          (line): line is { product: StoreProduct; quantity: number } => line !== null,
        ),
    [cart, initialProducts],
  );

  const verifiedProducts = initialProducts.filter(
    (product) => product.published && product.source === "verified",
  );
  const featuredProduct =
    verifiedProducts.find((product) => product.priceCop !== null) ?? initialProducts[0] ?? null;
  const knownUnits = verifiedProducts.reduce(
    (total, product) => total + (product.stock ?? 0),
    0,
  );
  const cartQuantity = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce(
    (total, line) => total + (line.product.priceCop ?? 0) * line.quantity,
    0,
  );

  function updateCart(updater: CartUpdater): void {
    persistCart(updater(cart));
  }

  function addToCart(product: StoreProduct) {
    if (product.priceCop === null || product.source !== "verified") return;

    updateCart((current) => ({
      ...current,
      [product.id]: Math.min((current[product.id] ?? 0) + 1, 20),
    }));
    setCartOpen(true);
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    updateCart((current) => {
      if (nextQuantity <= 0) {
        const next: Record<string, number> = { ...current };
        delete next[productId];
        return next;
      }

      return { ...current, [productId]: Math.min(nextQuantity, 20) };
    });
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ir al inicio de O&K Trends">
          <span className="brand-mark">O&K</span>
          <span>
            <strong>O&K Trends</strong>
            <small>Estilo que marca tu tiempo</small>
          </span>
        </a>

        <nav aria-label="Navegación principal">
          <a href="#catalogo">Catálogo</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#preguntas">Preguntas</a>
        </nav>

        <button className="cart-button" type="button" onClick={() => setCartOpen(true)}>
          Carrito <span>{cartQuantity}</span>
        </button>
      </header>

      <main id="inicio">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">TIENDA MULTICATEGORÍA · SANTA MARTA</span>
            <h1>Accesorios y estilo para destacar todos los días.</h1>
            <p>
              Compra relojes y descubre las próximas colecciones de perfumes, ropa,
              gorras, zapatos y accesorios de O&K Trends.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#catalogo">Ver catálogo</a>
              <a className="secondary-button" href="#beneficios">Cómo comprar</a>
            </div>
            <div className="trust-row" aria-label="Beneficios de compra">
              <span>✓ Precios verificados</span>
              <span>✓ Garantía informada</span>
              <span>✓ Atención personalizada</span>
            </div>
          </div>

          <div className="hero-card" aria-label="Producto destacado">
            <span className="hero-card-badge">DESTACADO</span>
            <div className="watch-visual" aria-hidden="true">
              <span className="watch-face">O&K</span>
            </div>
            <div>
              <small>{featuredProduct?.name ?? "Catálogo O&K Trends"}</small>
              <strong>{formatCop(featuredProduct?.priceCop ?? null)}</strong>
              <p>
                {featuredProduct?.stock === null || featuredProduct?.stock === undefined
                  ? "Disponibilidad pendiente de confirmación."
                  : `Quedan ${featuredProduct.stock} unidades registradas.`}
              </p>
            </div>
          </div>
        </section>

        <section className="metrics" aria-label="Estado de la tienda">
          <article><strong>{categories.length}</strong><span>Categorías preparadas</span></article>
          <article><strong>{verifiedProducts.length}</strong><span>Productos verificados</span></article>
          <article><strong>{knownUnits}</strong><span>Unidades conocidas</span></article>
          <article><strong>{catalogSource === "supabase" ? "En línea" : "Seguro"}</strong><span>Fuente del catálogo</span></article>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CATÁLOGO</span>
              <h2>Encuentra tu próximo favorito</h2>
            </div>
            <label className="search-box">
              <span className="sr-only">Buscar productos</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o característica"
              />
            </label>
          </div>

          {catalogWarning ? (
            <p className="empty-state" role="status">
              Catálogo protegido: se muestran datos locales verificados mientras se restablece la fuente principal.
            </p>
          ) : null}

          <div className="category-list" role="list" aria-label="Categorías">
            <button
              className={category === "all" ? "active" : ""}
              type="button"
              onClick={() => setCategory("all")}
            >
              Todo
            </button>
            {categories.map((item) => (
              <button
                className={category === item.id ? "active" : ""}
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
              >
                <span aria-hidden="true">{item.icon}</span> {item.name}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-art" style={{ background: product.accent }}>
                  <span>{product.categoryId === "watches" ? "⌚" : "O&K"}</span>
                  {product.badge ? <small>{product.badge}</small> : null}
                </div>
                <div className="product-content">
                  <div>
                    <span className="product-source">
                      {product.source === "verified" ? "Datos verificados" : "Vista previa"}
                    </span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-footer">
                    <div>
                      <strong>{formatCop(product.priceCop)}</strong>
                      {product.warranty ? <small>{product.warranty}</small> : null}
                    </div>
                    <button
                      type="button"
                      disabled={product.priceCop === null || product.source !== "verified"}
                      onClick={() => addToCart(product)}
                    >
                      {product.priceCop === null ? "Próximamente" : "Agregar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <p className="empty-state">No encontramos productos con esos filtros.</p>
          ) : null}
        </section>

        <section className="benefit-section" id="beneficios">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">COMPRA CON CONFIANZA</span>
              <h2>Una experiencia clara, sin promesas inventadas</h2>
            </div>
          </div>
          <div className="benefit-grid">
            <article><span>01</span><h3>Explora</h3><p>Busca por categoría y revisa únicamente datos comerciales registrados.</p></article>
            <article><span>02</span><h3>Agrega</h3><p>Guarda productos en un carrito persistente dentro de tu dispositivo.</p></article>
            <article><span>03</span><h3>Confirma</h3><p>El checkout definitivo se habilitará cuando estén configurados contacto, entrega y pagos.</p></article>
          </div>
        </section>

        <section className="faq-section" id="preguntas">
          <span className="eyebrow">PREGUNTAS FRECUENTES</span>
          <h2>Información comercial disponible</h2>
          <details><summary>¿Dónde opera O&K Trends?</summary><p>La operación general está registrada en Santa Marta, Magdalena. La dirección exacta aún no está publicada.</p></details>
          <details><summary>¿Qué garantía tienen los relojes?</summary><p>Las referencias indicadas incluyen 3 meses por maquinaria y batería.</p></details>
          <details><summary>¿Cómo finalizo mi compra?</summary><p>El carrito ya funciona. La confirmación de pedidos se activará cuando el propietario configure los canales oficiales de contacto, entrega y pago.</p></details>
        </section>
      </main>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">O&K</span><span><strong>O&K Trends</strong><small>Santa Marta, Colombia</small></span></div>
        <p>Plataforma en construcción controlada. No procesa pagos todavía.</p>
      </footer>

      {cartOpen ? (
        <div className="cart-backdrop" role="presentation" onMouseDown={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            aria-label="Carrito de compras"
            aria-modal="true"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cart-header">
              <div><span className="eyebrow">TU SELECCIÓN</span><h2>Carrito</h2></div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">×</button>
            </div>

            {cartLines.length === 0 ? (
              <p className="empty-state">Tu carrito está vacío.</p>
            ) : (
              <div className="cart-lines">
                {cartLines.map(({ product, quantity }) => (
                  <article key={product.id}>
                    <div><strong>{product.name}</strong><span>{formatCop(product.priceCop)}</span></div>
                    <div className="quantity-control">
                      <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="cart-summary">
              <span>Subtotal</span>
              <strong>{formatCop(subtotal)}</strong>
            </div>
            <button className="checkout-button" type="button" disabled>
              Checkout pendiente de configuración
            </button>
            <small className="cart-note">
              No solicitaremos pagos ni datos bancarios hasta configurar una pasarela oficial.
            </small>
          </aside>
        </div>
      ) : null}
    </>
  );
}
