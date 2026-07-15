export const categories = [
  { id: "watches", name: "Relojes", icon: "⌚" },
  { id: "perfumes", name: "Perfumes", icon: "✦" },
  { id: "clothing", name: "Ropa", icon: "◈" },
  { id: "caps", name: "Gorras", icon: "◇" },
  { id: "shoes", name: "Zapatos", icon: "◆" },
  { id: "accessories", name: "Accesorios", icon: "◎" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export interface StoreProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categoryId: CategoryId;
  readonly description: string;
  readonly priceCop: number | null;
  readonly compareAtPriceCop: number | null;
  readonly stock: number | null;
  readonly warranty: string | null;
  readonly badge: string | null;
  readonly accent: string;
  readonly published: boolean;
  readonly source: "verified" | "placeholder";
}

export const products: readonly StoreProduct[] = [
  {
    id: "watch-richard-mille-black",
    slug: "richard-mille-negro",
    name: "Reloj Richard Mille negro",
    categoryId: "watches",
    description:
      "Reloj análogo para caballero, pulso en silicona y fecha. Modelo de demostración del catálogo comercial.",
    priceCop: 89_900,
    compareAtPriceCop: null,
    stock: 4,
    warranty: "3 meses por maquinaria y batería",
    badge: "Pocas unidades",
    accent: "linear-gradient(145deg, #101716, #315f51)",
    published: true,
    source: "verified",
  },
  {
    id: "watch-technomarine-men",
    slug: "technomarine-caballero",
    name: "Reloj Technomarine caballero",
    categoryId: "watches",
    description:
      "Hora análoga, fecha, pulso en silicona, excelente acabado e incluye estuche.",
    priceCop: 120_000,
    compareAtPriceCop: null,
    stock: null,
    warranty: "3 meses por maquinaria y batería",
    badge: "Incluye estuche",
    accent: "linear-gradient(145deg, #102035, #2e6389)",
    published: true,
    source: "verified",
  },
  {
    id: "preview-perfumes",
    slug: "perfumes-proximamente",
    name: "Colección de perfumes",
    categoryId: "perfumes",
    description:
      "Categoría preparada para cargar referencias, tamaños, aromas y precios verificados.",
    priceCop: null,
    compareAtPriceCop: null,
    stock: null,
    warranty: null,
    badge: "Próximamente",
    accent: "linear-gradient(145deg, #3a1735, #9b527d)",
    published: true,
    source: "placeholder",
  },
  {
    id: "preview-fashion",
    slug: "moda-proximamente",
    name: "Moda y accesorios",
    categoryId: "accessories",
    description:
      "Espacio reservado para ropa, gorras, zapatos y accesorios con variantes de talla y color.",
    priceCop: null,
    compareAtPriceCop: null,
    stock: null,
    warranty: null,
    badge: "Catálogo en preparación",
    accent: "linear-gradient(145deg, #382b13, #92733c)",
    published: true,
    source: "placeholder",
  },
] as const;

export const verifiedProducts = products.filter(
  (product) => product.published && product.source === "verified",
);
