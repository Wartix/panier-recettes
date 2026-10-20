import { describe, expect, it } from "vitest";
import { bestProduct, matchProductName } from "@/lib/ingredients/match";

describe("product matching", () => {
  it("maps bilingual shelf labels to the more specific ingredient", () => {
    expect(matchProductName("Poulet poitrine désossée sans peau")?.itemKey).toBe("chicken_breast");
    expect(matchProductName("Beurre salé 454 g")?.itemKey).toBe("butter");
    expect(matchProductName("Pois chiches en conserve")?.itemKey).toBe("chickpea");
    expect(matchProductName("Lait 2% 2 L")?.itemKey).toBe("milk");
    expect(matchProductName("Gros œufs")?.itemKey).toBe("egg");
    expect(matchProductName("Détergent à lessive")).toBeNull();
    expect(matchProductName("Kombucha au gingembre")).toBeNull();
    expect(matchProductName("Lait glacé à la vanille")).toBeNull();
    expect(matchProductName("Fromage feta au lait de vache et de chèvre")).toBeNull();
    expect(matchProductName("Rouleaux de printemps au poulet surgelés")).toBeNull();
  });

  it("prefers a product already tagged with the ingredient", () => {
    const picked = bestProduct("butter", [
      { name: "Margarine", itemKey: "vegetable_oil" },
      { name: "Beurre d'arachide", itemKey: "peanut_butter" },
      { name: "Beurre salé", itemKey: "butter" },
    ]);
    expect(picked?.name).toBe("Beurre salé");
  });
});
