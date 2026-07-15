import { Storefront } from "@/components/storefront";
import { loadCatalogSnapshot } from "@/lib/data/catalog-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await loadCatalogSnapshot();

  return (
    <Storefront
      catalogSource={catalog.source}
      catalogWarning={catalog.warning}
      initialProducts={catalog.products}
    />
  );
}
