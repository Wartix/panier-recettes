import { describe, expect, it } from "vitest";
import { median, saleDecision } from "@/lib/pricing/alerts";

describe("sale alerts", () => {
  it("uses the median of earlier prices as the usual price", () => {
    expect(median([1840, 1750, 1799])).toBe(1799);
    const decision = saleDecision([
      { priceCents: 1840 },
      { priceCents: 1750 },
      { priceCents: 1799 },
      { priceCents: 1399, onSale: true },
    ]);
    expect(decision.usualCents).toBe(1799);
    expect(decision.alert).toBe(true);
    expect(decision.drop).toBeGreaterThan(0.2);
  });

  it("stays quiet on a small move and on a single observation", () => {
    const quiet = saleDecision([{ priceCents: 1799 }, { priceCents: 1840 }, { priceCents: 1750 }]);
    expect(quiet.alert).toBe(false);
    expect(saleDecision([{ priceCents: 399, onSale: true }]).alert).toBe(false);
  });
});
