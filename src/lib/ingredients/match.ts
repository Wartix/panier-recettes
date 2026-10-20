import { aliasesOf, fold, getIngredient, INGREDIENTS, type IngredientDef } from "@/lib/ingredients/dictionary";

const PREP =
  /\b(chopped|diced|minced|fresh|sliced|roughly|finely|finely|environ|optional|facultatif|optionnel|optionnelle|frais|fraiche|frache|emince|cisele|hache menu)\b/g;

const SIZE = /\b\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l|lb|oz|fl oz)\b/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeIngredientText(name: string): string {
  return fold(name).replace(SIZE, " ").replace(PREP, " ").replace(/\s+/g, " ").trim();
}

export function containsAlias(haystack: string, alias: string): boolean {
  if (!alias) return false;
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(alias)}(?:es|s|x)?(?:\\s|$)`);
  return pattern.test(haystack);
}

export type IngredientMatch = {
  itemKey: string;
  score: number;
  alias: string;
  def: IngredientDef;
};

function scoreHaystack(haystack: string): IngredientMatch | null {
  if (!haystack) return null;
  let best: IngredientMatch | null = null;
  for (const def of INGREDIENTS) {
    for (const alias of aliasesOf(def)) {
      const folded = fold(alias);
      if (!folded) continue;
      if (folded.length < 3 && haystack !== folded) continue;
      let score = 0;
      if (haystack === folded) score = 2000 + folded.length;
      else if (containsAlias(haystack, folded)) score = 1000 + folded.length;
      else continue;
      if (!best || score > best.score) {
        best = { itemKey: def.key, score, alias: folded, def };
      }
    }
  }
  return best && best.score >= 1000 ? best : null;
}

export function matchIngredientName(name: string): IngredientMatch | null {
  const kept = fold(name.replace(SIZE, " "));
  const stripped = normalizeIngredientText(name);
  const primary = scoreHaystack(kept);
  const secondary = stripped === kept ? null : scoreHaystack(stripped);
  if (!primary) return secondary;
  if (!secondary) return primary;
  return secondary.score > primary.score ? secondary : primary;
}

export type ProductCandidate = {
  id?: string;
  name: string;
  itemKey?: string;
  storeId?: string;
};

export type ProductMatch = {
  itemKey: string;
  score: number;
  productName: string;
};

const SHELF_NEXT_REJECT = new Set(["glace", "glacee", "aromatise", "aromatisee", "saveur", "gazeuse", "pane", "panes", "panee"]);

function shelfIsConfident(name: string, found: IngredientMatch): boolean {
  const haystack = fold(name.replace(SIZE, " ")).replace(/\s+/g, " ").trim();
  if (!haystack) return false;
  for (const alias of aliasesOf(found.def).map((value) => fold(value)).filter(Boolean)) {
    if (haystack === alias) return true;
    if (containsAlias(haystack, alias) && alias.length / haystack.length >= 0.55) return true;
    if (!haystack.startsWith(`${alias} `)) continue;
    const next = haystack.slice(alias.length).trim().split(" ")[0] ?? "";
    if (SHELF_NEXT_REJECT.has(next)) continue;
    if (alias.length <= 3 && haystack.length > alias.length + 8) continue;
    return true;
  }
  return false;
}

/** Fuzzy bilingual match from a shelf label to a canonical ingredient. */
export function matchProductName(name: string): ProductMatch | null {
  const found = matchIngredientName(name);
  if (!found || !shelfIsConfident(name, found)) return null;
  return { itemKey: found.itemKey, score: found.score, productName: name };
}

export function bestProduct<T extends ProductCandidate>(itemKey: string, products: T[]): T | null {
  const def = getIngredient(itemKey);
  if (!def) return null;
  let best: { product: T; score: number } | null = null;
  for (const product of products) {
    if (product.itemKey && product.itemKey === itemKey) {
      return product;
    }
    const found = matchIngredientName(product.name);
    if (!found || found.itemKey !== itemKey) continue;
    if (!best || found.score > best.score) best = { product, score: found.score };
  }
  return best?.product ?? null;
}
