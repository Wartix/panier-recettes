export type ImportedRecipe = {
  title: string;
  description: string;
  cuisine: string;
  origin: string;
  language: "fr" | "en";
  imageUrl: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredientLines: string[];
  steps: string[];
  sourceUrl: string;
};

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function asObject(value: Json | undefined): { [key: string]: Json } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function typesOf(node: { [key: string]: Json }): string[] {
  const kind = node["@type"];
  if (typeof kind === "string") return [kind];
  if (Array.isArray(kind)) return kind.filter((item): item is string => typeof item === "string");
  return [];
}

function collectRecipes(value: Json, into: { [key: string]: Json }[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectRecipes(item, into);
    return;
  }
  const node = asObject(value);
  if (!node) return;
  if (typesOf(node).includes("Recipe")) into.push(node);
  if (node["@graph"]) collectRecipes(node["@graph"], into);
  if (node.mainEntity) collectRecipes(node.mainEntity, into);
}

export function extractJsonLdBlocks(html: string): Json[] {
  const blocks: Json[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[1].trim().replace(/^\s*<!--/, "").replace(/-->\s*$/, "");
    try {
      blocks.push(JSON.parse(raw) as Json);
    } catch {
      continue;
    }
  }
  return blocks;
}

function textOf(value: Json | undefined): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  const node = asObject(value);
  if (!node) return "";
  if (typeof node.text === "string") return node.text.trim();
  if (typeof node.name === "string") return node.name.trim();
  return "";
}

function instructionsOf(value: Json | undefined): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) return value.flatMap((item) => instructionsOf(item));
  const node = asObject(value);
  if (!node) return [];
  if (Array.isArray(node.itemListElement)) return instructionsOf(node.itemListElement);
  const text = textOf(node);
  return text ? [text] : [];
}

function imageOf(value: Json | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageOf(value[0]);
  const node = asObject(value);
  if (!node) return "";
  if (typeof node.url === "string") return node.url;
  return "";
}

export function parseIsoDuration(value: string): number {
  const match = value.trim().match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!match) return 0;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return days * 24 * 60 + hours * 60 + minutes;
}

export function parseYield(value: Json | undefined): number {
  const text = Array.isArray(value) ? value.map(textOf).join(" ") : textOf(value);
  const match = text.match(/\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 0;
}

function cuisineOf(value: Json | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(", ");
  return textOf(value);
}

function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

const FR_HINT = /\b(de|du|des|au|aux|et|les|une|gousse|tasse|cuillère|cuillere|sel|poivre|oignon)\b/gi;
const EN_HINT = /\b(cup|cups|of|the|and|tablespoon|teaspoon|chopped|salt|pepper)\b/gi;

export function detectLanguage(text: string): "fr" | "en" {
  const fr = text.match(FR_HINT)?.length ?? 0;
  const en = text.match(EN_HINT)?.length ?? 0;
  return fr > en ? "fr" : "en";
}

const ORIGIN: [RegExp, string, string][] = [
  [/qu[eé]b[eé]cois|quebec|tourti[eè]re|p[âa]t[eé] chinois/, "Québécoise", "Canada"],
  [/indian|indien|masala|tikka|curry/, "Indian", "India"],
  [/mexican|mexic|taco|tinga|chipotle/, "Mexican", "Mexico"],
  [/japanese|japon|miso|dashi|ramen|teriyaki/, "Japanese", "Japan"],
  [/italian|italien|pasta|spaghetti|risotto/, "Italian", "Italy"],
  [/french|fran[cç]ais|ratatouille|proven[cç]al/, "French", "France"],
  [/morocc|maghreb|tajine|couscous/, "Moroccan", "Morocco"],
  [/thai|pad thai/, "Thai", "Thailand"],
  [/chinese|chinois|stir fry|wok/, "Chinese", "China"],
];

export function inferCuisine(title: string, cuisine: string, lines: string[]): { cuisine: string; origin: string } {
  if (cuisine.trim()) {
    const hint = ORIGIN.find(([rule]) => rule.test(`${cuisine} ${title}`));
    return { cuisine: cuisine.trim(), origin: hint?.[2] ?? "" };
  }
  const hay = `${title} ${lines.join(" ")}`.toLowerCase();
  const hint = ORIGIN.find(([rule]) => rule.test(hay));
  return { cuisine: hint?.[1] ?? "", origin: hint?.[2] ?? "" };
}

function recipeFromNode(node: { [key: string]: Json }, pageUrl: string): ImportedRecipe | null {
  const title = textOf(node.name);
  const ingredientLines = (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : [])
    .map((item) => textOf(item))
    .filter(Boolean);
  if (!title || ingredientLines.length === 0) return null;
  const steps = instructionsOf(node.recipeInstructions);
  const cuisineRaw = cuisineOf(node.recipeCuisine);
  const inferred = inferCuisine(title, cuisineRaw, ingredientLines);
  const blob = `${title} ${ingredientLines.join(" ")} ${steps.join(" ")}`;
  return {
    title,
    description: textOf(node.description),
    cuisine: inferred.cuisine,
    origin: inferred.origin,
    language: detectLanguage(blob),
    imageUrl: imageOf(node.image),
    servings: parseYield(node.recipeYield) || 4,
    prepMinutes: parseIsoDuration(textOf(node.prepTime)),
    cookMinutes: parseIsoDuration(textOf(node.cookTime)),
    ingredientLines,
    steps,
    sourceUrl: pageUrl,
  };
}

export function bestJsonLdRecipe(html: string, pageUrl: string): ImportedRecipe | null {
  const found: { [key: string]: Json }[] = [];
  for (const block of extractJsonLdBlocks(html)) collectRecipes(block, found);
  const parsed = found
    .map((node) => ({ node, recipe: recipeFromNode(node, pageUrl) }))
    .filter((entry): entry is { node: { [key: string]: Json }; recipe: ImportedRecipe } => Boolean(entry.recipe));
  if (!parsed.length) return null;
  const wanted = canonicalUrl(pageUrl);
  const matching = parsed.filter(({ node }) => {
    const url = textOf(node.url) || textOf(node["@id"]);
    return Boolean(url) && canonicalUrl(url) === wanted;
  });
  const pool = matching.length ? matching : parsed;
  pool.sort((a, b) => b.recipe.ingredientLines.length - a.recipe.ingredientLines.length);
  return pool[0].recipe;
}
