import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { products, type CategoryId, type StoreProduct } from "../../data/catalog";
import {
  getServerConfiguration,
  isSupabaseConfigured,
  type ServerConfiguration,
} from "../server-env";

export type CatalogSource = "seed" | "supabase";

export interface CatalogSnapshot {
  readonly source: CatalogSource;
  readonly products: readonly StoreProduct[];
  readonly generatedAt: string;
  readonly warning: string | null;
}

const PublicCatalogRowSchema = z.object({
  product_id: z.string().min(1),
  product_slug: z.string().min(1),
  product_name: z.string().min(1),
  category_slug: z.string().nullable(),
  description: z.string().nullable(),
  price_cop: z.coerce.number().int().nonnegative(),
  compare_at_price_cop: z.coerce.number().int().nonnegative().nullable(),
  available_stock: z.coerce.number().int().nonnegative().nullable(),
  warranty_text: z.string().nullable(),
  featured: z.boolean(),
});

const categoryMap: Readonly<Record<string, CategoryId>> = {
  relojes: "watches",
  perfumes: "perfumes",
  ropa: "clothing",
  gorras: "caps",
  zapatos: "shoes",
  accesorios: "accessories",
};

const accents: Readonly<Record<CategoryId, string>> = {
  watches: "linear-gradient(145deg, #101716, #315f51)",
  perfumes: "linear-gradient(145deg, #3a1735, #9b527d)",
  clothing: "linear-gradient(145deg, #2c2435, #75618b)",
  caps: "linear-gradient(145deg, #382b13, #92733c)",
  shoes: "linear-gradient(145deg, #1c2533, #536d91)",
  accessories: "linear-gradient(145deg, #16312a, #438b73)",
};

function mapCategory(value: string | null): CategoryId {
  if (!value) return "accessories";
  return categoryMap[value] ?? "accessories";
}

function seedSnapshot(warning: string | null = null): CatalogSnapshot {
  return {
    source: "seed",
    products,
    generatedAt: new Date().toISOString(),
    warning,
  };
}

async function loadFromSupabase(
  configuration: ServerConfiguration,
): Promise<CatalogSnapshot> {
  if (!configuration.supabaseUrl || !configuration.supabasePublishableKey) {
    return seedSnapshot();
  }

  const client = createClient(
    configuration.supabaseUrl,
    configuration.supabasePublishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Client-Info": "ok-trends-storefront" } },
    },
  );

  const { data, error } = await client.rpc("get_public_catalog", {
    target_tenant_slug: "o-k-trends",
  });

  if (error) {
    throw new Error(`Supabase catalog error: ${error.message}`);
  }

  const rows = z.array(PublicCatalogRowSchema).parse(data ?? []);
  const mappedProducts: StoreProduct[] = rows.map((row) => {
    const categoryId = mapCategory(row.category_slug);

    return {
      id: row.product_id,
      slug: row.product_slug,
      name: row.product_name,
      categoryId,
      description: row.description ?? "Producto registrado en el catálogo de O&K Trends.",
      priceCop: row.price_cop,
      compareAtPriceCop: row.compare_at_price_cop,
      stock: row.available_stock,
      warranty: row.warranty_text,
      badge:
        row.available_stock !== null && row.available_stock <= 4
          ? "Pocas unidades"
          : row.featured
            ? "Destacado"
            : null,
      accent: accents[categoryId],
      published: true,
      source: "verified",
    };
  });

  if (mappedProducts.length === 0) {
    return seedSnapshot("Supabase respondió sin productos activos; se usó el catálogo seguro local.");
  }

  return {
    source: "supabase",
    products: mappedProducts,
    generatedAt: new Date().toISOString(),
    warning: null,
  };
}

export async function loadCatalogSnapshot(
  configuration = getServerConfiguration(),
): Promise<CatalogSnapshot> {
  if (!isSupabaseConfigured(configuration)) return seedSnapshot();

  try {
    return await loadFromSupabase(configuration);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Error desconocido";
    return seedSnapshot(`No fue posible consultar Supabase: ${reason}`);
  }
}

export function summarizeInventory(snapshot: CatalogSnapshot) {
  const verified = snapshot.products.filter((product) => product.source === "verified");
  const knownStock = verified.filter((product) => product.stock !== null);
  const totalUnits = knownStock.reduce((total, product) => total + (product.stock ?? 0), 0);
  const lowStock = knownStock.filter((product) => (product.stock ?? 0) <= 4).length;

  return {
    products: snapshot.products.length,
    verifiedProducts: verified.length,
    productsWithKnownStock: knownStock.length,
    totalUnits,
    lowStock,
  } as const;
}
