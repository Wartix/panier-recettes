import { describe, expect, it } from "vitest";
import { optimizeBasket } from "@/lib/pricing/optimize";
import type { Offer } from "@/lib/pricing/cost";

function offer(storeId: string, itemKey: string, priceCents: number): Offer {
  return {
    storeId,
    itemKey,
    productName: itemKey,
    priceCents,
    packageQty: 1,
    packageUnit: "ct",
    loose: true,
  };
}

describe("optimizeBasket", () => {
  it("picks one store when it is cheapest and a 2-store split when that saves money", () => {
    const offers = [
      offer("maxi", "beef", 1000),
      offer("maxi", "potato", 400),
      offer("maxi", "corn", 300),
      offer("superc", "beef", 1200),
      offer("superc", "potato", 300),
      offer("superc", "corn", 200),
    ];
    const items = [
      { itemKey: "beef", name: "Boeuf", quantity: 1, unit: "ct" },
      { itemKey: "potato", name: "Patate", quantity: 1, unit: "ct" },
      { itemKey: "corn", name: "Mais", quantity: 1, unit: "ct" },
    ];
    const plan = optimizeBasket({ items, offers });
    expect(plan.single?.storeIds).toEqual(["maxi"]);
    expect(plan.single?.totalCents).toBe(1700);
    expect(plan.split?.storeIds.sort()).toEqual(["maxi", "superc"]);
    expect(plan.split?.totalCents).toBe(1500);
  });

  it("uses a third store only when the trio is cheaper", () => {
    const offers = [
      offer("costco", "beef", 800),
      offer("iga", "potato", 250),
      offer("iga", "corn", 300),
      offer("metro", "potato", 400),
      offer("metro", "corn", 150),
    ];
    const items = [
      { itemKey: "beef", name: "Boeuf", quantity: 1, unit: "ct" },
      { itemKey: "potato", name: "Patate", quantity: 1, unit: "ct" },
      { itemKey: "corn", name: "Mais", quantity: 1, unit: "ct" },
    ];
    const plan = optimizeBasket({ items, offers });
    expect(plan.split?.storeIds.sort()).toEqual(["costco", "iga", "metro"]);
    expect(plan.split?.totalCents).toBe(1200);
    expect(plan.single?.complete).toBe(false);
  });

  it("fills a hole with a StatCan estimate without calling it a store", () => {
    const plan = optimizeBasket({
      items: [{ itemKey: "milk", name: "Lait", quantity: 1, unit: "ct" }],
      offers: [],
      estimates: [offer("statcan", "milk", 536)],
    });
    expect(plan.single?.complete).toBe(true);
    expect(plan.single?.storeIds).toEqual([]);
    expect(plan.single?.estimateCents).toBe(536);
  });
});
