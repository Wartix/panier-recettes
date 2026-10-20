export type ParsedStoreProduct = {
  externalId: string;
  name: string;
  brand: string;
  priceCents: number;
  regularPriceCents: number | null;
  onSale: boolean;
  unitPriceText: string;
  productUrl: string;
};

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCharCode(Number(digits)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function attr(chunk: string, name: string): string {
  const match = chunk.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? decode(match[1]) : "";
}

export const METRO_LISTING_PATHS = ["/epicerie-en-ligne/paniers-thematiques/produits-d-ici"];

export function parseMetroListing(html: string): ParsedStoreProduct[] {
  const products: ParsedStoreProduct[] = [];
  const parts = html.split("default-product-tile");
  for (const part of parts.slice(1)) {
    const chunk = part.slice(0, 12000);
    const externalId = attr(chunk, "data-product-code");
    const name = attr(chunk, "data-product-name");
    const price = Number(attr(chunk, "data-main-price").replace(",", "."));
    if (!externalId || !name || !Number.isFinite(price) || price <= 0) continue;
    const before = chunk.match(/pricing__before-price[\s\S]{0,300}?(\d+)[,.](\d{2})/);
    const regularPriceCents = before ? Number(before[1]) * 100 + Number(before[2]) : null;
    const priceCents = Math.round(price * 100);
    const secondary = chunk.match(/pricing__secondary-price[\s\S]{0,240}?(\d+[,.]\d{2}[^<]{0,24})/);
    const href = chunk.match(/href="(\/epicerie-en-ligne\/[^"]*\/p\/[^"]+)"/);
    products.push({
      externalId,
      name,
      brand: attr(chunk, "data-product-brand"),
      priceCents,
      regularPriceCents,
      onSale: regularPriceCents != null && regularPriceCents > priceCents,
      unitPriceText: secondary ? decode(secondary[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ") : "",
      productUrl: href ? `https://www.metro.ca${href[1]}` : "",
    });
  }
  return products;
}
