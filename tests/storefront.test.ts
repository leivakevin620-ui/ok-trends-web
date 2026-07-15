import { describe, expect, it } from "vitest";
import { products, verifiedProducts } from "../src/data/catalog";
import { formatCop } from "../src/lib/currency";

describe("storefront catalog", () => {
  it("publishes only verified products with known prices in the verified list", () => {
    expect(verifiedProducts.length).toBeGreaterThan(0);

    for (const product of verifiedProducts) {
      expect(product.source).toBe("verified");
      expect(product.published).toBe(true);
      expect(product.priceCop).not.toBeNull();
    }
  });

  it("keeps product identifiers and slugs unique", () => {
    const ids = products.map((product) => product.id);
    const slugs = products.map((product) => product.slug);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("does not assign prices to placeholder products", () => {
    const placeholders = products.filter((product) => product.source === "placeholder");

    expect(placeholders.length).toBeGreaterThan(0);
    expect(placeholders.every((product) => product.priceCop === null)).toBe(true);
  });
});

describe("formatCop", () => {
  it("formats Colombian pesos without decimal places", () => {
    expect(formatCop(89_900)).toMatch(/89[.\s]?900/);
  });

  it("returns a safe label when the price is unknown", () => {
    expect(formatCop(null)).toBe("Precio por confirmar");
  });

  it("rejects negative or invalid values", () => {
    expect(() => formatCop(-1)).toThrow(RangeError);
    expect(() => formatCop(Number.NaN)).toThrow(RangeError);
  });
});
