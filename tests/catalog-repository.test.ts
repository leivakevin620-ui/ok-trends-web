import { describe, expect, it } from "vitest";
import { products } from "../src/data/catalog";
import {
  loadCatalogSnapshot,
  summarizeInventory,
  type CatalogSnapshot,
} from "../src/lib/data/catalog-repository";
import { getServerConfiguration } from "../src/lib/server-env";

describe("catalog repository", () => {
  it("uses the verified seed when Supabase is not configured", async () => {
    const configuration = getServerConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    });

    const snapshot = await loadCatalogSnapshot(configuration);

    expect(snapshot.source).toBe("seed");
    expect(snapshot.warning).toBeNull();
    expect(snapshot.products).toEqual(products);
  });

  it("summarizes only known inventory without inventing missing stock", () => {
    const snapshot: CatalogSnapshot = {
      source: "seed",
      products,
      generatedAt: new Date(0).toISOString(),
      warning: null,
    };

    const summary = summarizeInventory(snapshot);

    expect(summary.products).toBe(products.length);
    expect(summary.verifiedProducts).toBe(2);
    expect(summary.productsWithKnownStock).toBe(1);
    expect(summary.totalUnits).toBe(4);
    expect(summary.lowStock).toBe(1);
  });
});
