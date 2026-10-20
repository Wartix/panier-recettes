import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseMetroListing } from "@/lib/pricing/adapters/metro";

describe("Metro listing parser", () => {
  it("reads shelf price, unit price, and a sale's regular price", () => {
    const html = readFileSync(new URL("../../../../fixtures/metro-listing.html", import.meta.url), "utf8");
    const products = parseMetroListing(html);
    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      externalId: "059749896054",
      name: "Gros œufs",
      priceCents: 399,
      onSale: false,
    });
    expect(products[0].unitPriceText).toContain("0,33");
    expect(products[1]).toMatchObject({
      name: "Beurre salé",
      priceCents: 449,
      regularPriceCents: 599,
      onSale: true,
    });
  });
});
