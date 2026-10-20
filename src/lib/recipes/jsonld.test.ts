import { describe, expect, it } from "vitest";
import { bestJsonLdRecipe, parseIsoDuration } from "@/lib/recipes/jsonld";

const HTML = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"WebSite","name":"Example"},
  {"@type":"Recipe","name":"Side salad","recipeIngredient":["1 lettuce"],"recipeInstructions":"Toss."},
  {"@type":"Recipe","name":"Chana masala","url":"https://www.example.com/chana-masala","recipeCuisine":["North Indian","Punjabi"],
   "recipeYield":["4"],"prepTime":"PT20M","cookTime":"PT45M","description":"A pot of chickpeas.",
   "recipeIngredient":["1 cup dried chickpeas","1 onion, chopped","1 tbsp oil"],
   "recipeInstructions":[{"@type":"HowToSection","name":"Cook","itemListElement":[{"@type":"HowToStep","text":"Soak the chickpeas."},{"@type":"HowToStep","text":"Simmer with the onion."}]}]}
]}
</script>
</head><body></body></html>`;

describe("JSON-LD recipes", () => {
  it("prefers the recipe whose url matches and reads steps, yield, and times", () => {
    const recipe = bestJsonLdRecipe(HTML, "https://www.example.com/chana-masala");
    expect(recipe?.title).toBe("Chana masala");
    expect(recipe?.servings).toBe(4);
    expect(recipe?.prepMinutes).toBe(20);
    expect(recipe?.cookMinutes).toBe(45);
    expect(recipe?.ingredientLines).toHaveLength(3);
    expect(recipe?.steps).toEqual(["Soak the chickpeas.", "Simmer with the onion."]);
    expect(recipe?.cuisine).toMatch(/Indian/);
    expect(recipe?.origin).toBe("India");
    expect(parseIsoDuration("PT1H30M")).toBe(90);
  });
});
