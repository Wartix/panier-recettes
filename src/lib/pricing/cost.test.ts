import { describe, expect, it } from "vitest";
import { costNeeds, type Offer } from "@/lib/pricing/cost";

const butter: Offer = {
  storeId: "metro",
  itemKey: "butter",
  productName: "Beurre 454 g",
  priceCents: 546,
  packageQty: 454,
  packageUnit: "g",
  loose: false,
};

const beef: Offer = {
  storeId: "walmart",
  itemKey: "ground_beef",
  productName: "Bœuf haché",
  priceCents: 1677,
  packageQty: 1000,
  packageUnit: "g",
  loose: true,
};

describe("costNeeds", () => {
  it("separates the package you must buy from the prorated full cost", () => {
    const cost = costNeeds({
      servings: 4,
      pantry: [],
      offers: [butter, beef],
      needs: [
        { itemKey: "butter", name: "beurre", quantity: 200, unit: "g" },
        { itemKey: "ground_beef", name: "bœuf", quantity: 800, unit: "g" },
        { itemKey: "salt", name: "sel", quantity: null, unit: "" },
      ],
    });

    const butterLine = cost.lines[0];
    expect(butterLine.buyCostCents).toBe(546);
    expect(butterLine.fullCostCents).toBe(Math.round((546 * 200) / 454));
    expect(cost.lines[1].buyCostCents).toBe(Math.round(1677 * 0.8));
    expect(cost.lines[1].fullCostCents).toBe(Math.round(1677 * 0.8));
    expect(cost.buyCostCents).toBe((butterLine.buyCostCents ?? 0) + (cost.lines[1].buyCostCents ?? 0));
    expect(cost.perServingBuyCents).toBe(Math.round(cost.buyCostCents / 4));
  });

  it("counts only what is missing from the pantry", () => {
    const cost = costNeeds({
      servings: 2,
      pantry: [{ itemKey: "butter", quantity: 200, unit: "g" }],
      offers: [butter],
      needs: [{ itemKey: "butter", name: "beurre", quantity: 60, unit: "g" }],
    });
    expect(cost.lines[0].missingQty).toBe(0);
    expect(cost.lines[0].buyCostCents).toBe(0);
    expect(cost.lines[0].fullCostCents).toBe(Math.round((546 * 60) / 454));
    expect(cost.buyCostCents).toBe(0);
    expect(cost.fullCostCents).toBeGreaterThan(0);
  });

  it("converts a counted onion onto a per-kilogram price", () => {
    const cost = costNeeds({
      servings: 4,
      pantry: [],
      offers: [
        {
          storeId: "maxi",
          itemKey: "onion",
          productName: "Oignons",
          priceCents: 494,
          packageQty: 1000,
          packageUnit: "g",
          loose: true,
        },
      ],
      needs: [{ itemKey: "onion", name: "oignon", quantity: 1, unit: "ct" }],
    });
    expect(cost.lines[0].fullCostCents).toBe(Math.round((494 * 150) / 1000));
  });
});
