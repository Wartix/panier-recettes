import { describe, expect, it } from "vitest";
import { convert } from "@/lib/ingredients/units";
import { parseIngredientLine } from "@/lib/ingredients/parse";

describe("parseIngredientLine", () => {
  it("parses French metric and cup lines", () => {
    const flour = parseIngredientLine("2 tasses de farine");
    expect(flour.quantity).toBe(2);
    expect(flour.unit).toBe("tasse");
    expect(flour.itemKey).toBe("flour");

    const butter = parseIngredientLine("200 g de beurre");
    expect(butter.quantity).toBe(200);
    expect(butter.unit).toBe("g");
    expect(butter.itemKey).toBe("butter");

    const oil = parseIngredientLine("1 1/2 c. à soupe d'huile d'olive");
    expect(oil.quantity).toBe(1.5);
    expect(oil.unit).toBe("tbsp");
    expect(oil.itemKey).toBe("olive_oil");

    const cumin = parseIngredientLine("½ c. à thé de cumin");
    expect(cumin.quantity).toBe(0.5);
    expect(cumin.unit).toBe("tsp");
    expect(cumin.itemKey).toBe("cumin");
  });

  it("parses English fractions, imperial weight, and garlic cloves", () => {
    const onion = parseIngredientLine("1/2 cup chopped onion");
    expect(onion.quantity).toBe(0.5);
    expect(onion.unit).toBe("cup");
    expect(onion.itemKey).toBe("onion");

    const thigh = parseIngredientLine("800g chicken thighs");
    expect(thigh.quantity).toBe(800);
    expect(thigh.unit).toBe("g");
    expect(thigh.itemKey).toBe("chicken_thigh");

    const garlic = parseIngredientLine("3 gousses d'ail");
    expect(garlic.quantity).toBe(3);
    expect(garlic.unit).toBe("clove");
    expect(garlic.itemKey).toBe("garlic");
  });

  it("keeps salt, optionals, ranges, and can sizes", () => {
    const salt = parseIngredientLine("sel");
    expect(salt.quantity).toBeNull();
    expect(salt.itemKey).toBe("salt");

    const parsley = parseIngredientLine("persil frais (facultatif)");
    expect(parsley.optional).toBe(true);
    expect(parsley.itemKey).toBe("parsley");

    const onions = parseIngredientLine("2-3 oignons");
    expect(onions.quantity).toBe(2);
    expect(onions.unit).toBe("ct");
    expect(onions.itemKey).toBe("onion");
    expect(onions.notes).toContain("2-3");

    const tomatoes = parseIngredientLine("1 (796 ml) can diced tomatoes");
    expect(tomatoes.quantity).toBe(796);
    expect(tomatoes.unit).toBe("ml");
    expect(tomatoes.itemKey).toBe("canned_tomato");
  });
});

describe("unit conversion", () => {
  it("converts imperial and metric, including flour density", () => {
    expect(convert(1, "lb", "g")).toBeCloseTo(453.592, 2);
    expect(convert(1, "cup", "ml")).toBe(240);
    expect(convert(1, "tasse", "ml")).toBe(250);
    expect(convert(1, "tbsp", "ml")).toBe(15);
    const grams = convert(1, "cup", "g", "flour");
    expect(grams).toBeCloseTo(240 * 0.53, 2);
  });
});
