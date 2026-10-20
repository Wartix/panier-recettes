import { parse } from "node-html-parser";
import { detectLanguage, inferCuisine, type ImportedRecipe } from "@/lib/recipes/jsonld";

function prop(scope: ReturnType<typeof parse>, name: string): string[] {
  return scope
    .querySelectorAll(`[itemprop="${name}"]`)
    .map((node) => (node.getAttribute("content") || node.text || "").trim())
    .filter(Boolean);
}

export function parseMicrodataRecipe(html: string, pageUrl: string): ImportedRecipe | null {
  const root = parse(html);
  const scope = root.querySelector('[itemtype*="schema.org/Recipe"]');
  if (!scope) return null;
  const title = prop(scope, "name")[0];
  const ingredientLines = prop(scope, "recipeIngredient");
  if (!title || ingredientLines.length < 2) return null;
  const steps = prop(scope, "text").filter((line) => line.length > 1);
  const cuisine = prop(scope, "recipeCuisine")[0] ?? "";
  const inferred = inferCuisine(title, cuisine, ingredientLines);
  const blob = `${title} ${ingredientLines.join(" ")}`;
  const yieldText = prop(scope, "recipeYield")[0] ?? "";
  const servings = Number(yieldText.match(/\d+/)?.[0] ?? 4);
  return {
    title,
    description: prop(scope, "description")[0] ?? "",
    cuisine: inferred.cuisine,
    origin: inferred.origin,
    language: detectLanguage(blob),
    imageUrl: scope.querySelector("[itemprop='image']")?.getAttribute("src") ?? "",
    servings: Number.isFinite(servings) && servings > 0 ? servings : 4,
    prepMinutes: 0,
    cookMinutes: 0,
    ingredientLines,
    steps,
    sourceUrl: pageUrl,
  };
}
