import { getIngredient } from "@/lib/ingredients/dictionary";
import { matchIngredientName } from "@/lib/ingredients/match";

export type ParsedIngredient = {
  raw: string;
  quantity: number | null;
  unit: string;
  item: string;
  itemKey: string;
  notes: string;
  optional: boolean;
  displayFr: string;
  displayEn: string;
};

const FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const UNIT_PATTERNS: { re: RegExp; id: string }[] = [
  { re: /^(?:c\.?\s*[àa]\s*soupe|cuillères?\s*[àa]\s*soupe|càs|cas|tbsp|tablespoons?)(?=\s|$|[,.)])/i, id: "tbsp" },
  { re: /^(?:c\.?\s*[àa]\s*(?:thé|the)|cuillères?\s*[àa]\s*(?:thé|the)|càc|cac|tsp|teaspoons?)(?=\s|$|[,.)])/i, id: "tsp" },
  { re: /^(?:fl\.?\s*oz|fluid ounces?)(?=\s|$|[,.)])/i, id: "floz" },
  { re: /^(?:kilogrammes?|kilograms?|kg)(?=\s|$|[,.)])/i, id: "kg" },
  { re: /^(?:grammes?|grams?|gr|g)(?=\s|$|[,.)])/i, id: "g" },
  { re: /^(?:millilitres?|ml)(?=\s|$|[,.)])/i, id: "ml" },
  { re: /^(?:centilitres?|cl)(?=\s|$|[,.)])/i, id: "cl" },
  { re: /^(?:litres?|l)(?=\s|$|[,.)])/i, id: "l" },
  { re: /^(?:tasses?)(?=\s|$|[,.)])/i, id: "tasse" },
  { re: /^(?:cups?)(?=\s|$|[,.)])/i, id: "cup" },
  { re: /^(?:cuillères?\s*à\s*soupe)(?=\s|$|[,.)])/i, id: "tbsp" },
  { re: /^(?:onces?|oz)(?=\s|$|[,.)])/i, id: "oz" },
  { re: /^(?:livres?|pounds?|lbs?|lb)(?=\s|$|[,.)])/i, id: "lb" },
  { re: /^(?:gousses?|cloves?)(?=\s|$|[,.)])/i, id: "clove" },
  { re: /^(?:pincées?|pincees?|pinches?)(?=\s|$|[,.)])/i, id: "pinch" },
  { re: /^(?:boîtes?|boites?|cans?|tins?)(?=\s|$|[,.)])/i, id: "can" },
  { re: /^(?:bottes?|bunche?s?)(?=\s|$|[,.)])/i, id: "bunch" },
  { re: /^(?:tranches?|slices?)(?=\s|$|[,.)])/i, id: "slice" },
];

const OPTIONAL = /\b(facultatif|optionnel|optionnelle|optional)\b|\((?:facultatif|optional)\)|\b(au goût|au gout|to taste)\b/i;
const PREP_WORDS =
  /^(?:chopped|diced|minced|fresh|sliced|roughly|finely|frais|fraîche|fraiche|émincé|emincé|émince|ciselé|cisele|large|small|medium|boneless|skinless)\b/i;

function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function parseNumberToken(source: string): { qty: number; rest: string } | null {
  const text = source.trim();
  const range = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:à|a|-|–|—)\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i);
  if (range) {
    const qty = Number(range[1].replace(",", "."));
    return { qty, rest: text.slice(range[0].length).trim() };
  }
  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)(?=\s|$)/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (!den) return null;
    return { qty: whole + num / den, rest: text.slice(mixed[0].length).trim() };
  }
  const unicodeMixed = text.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])/);
  if (unicodeMixed) {
    return {
      qty: Number(unicodeMixed[1]) + (FRACTIONS[unicodeMixed[2]] ?? 0),
      rest: text.slice(unicodeMixed[0].length).trim(),
    };
  }
  const frac = text.match(/^(\d+)\s*\/\s*(\d+)(?=\s|$)/);
  if (frac) {
    const den = Number(frac[2]);
    if (!den) return null;
    return { qty: Number(frac[1]) / den, rest: text.slice(frac[0].length).trim() };
  }
  if (FRACTIONS[text[0]]) {
    return { qty: FRACTIONS[text[0]], rest: text.slice(1).trim() };
  }
  const decimal = text.match(/^(\d+(?:[.,]\d+)?)(?=\s|$|[a-zA-ZÀ-ÿ])/);
  if (decimal && text[decimal[0].length] !== "/") {
    return { qty: Number(decimal[1].replace(",", ".")), rest: text.slice(decimal[0].length).trim() };
  }
  return null;
}

function parseUnit(source: string): { unit: string; rest: string } | null {
  for (const pattern of UNIT_PATTERNS) {
    const match = source.match(pattern.re);
    if (match) {
      return { unit: pattern.id, rest: source.slice(match[0].length).trim() };
    }
  }
  return null;
}

function measureInParens(note: string): { quantity: number; unit: string } | null {
  const match = note.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|lb|oz)\b/i);
  if (!match) return null;
  const unitMap: Record<string, string> = { kg: "kg", g: "g", ml: "ml", l: "l", lb: "lb", oz: "oz" };
  return { quantity: Number(match[1].replace(",", ".")), unit: unitMap[match[2].toLowerCase()] ?? match[2].toLowerCase() };
}

function cleanItem(source: string): string {
  let item = source.replace(/\s+/g, " ").trim();
  item = item.replace(/^(?:de|d['’]|of|du|des|la|le|les)\s+/i, "");
  item = item.replace(/[.,;:]+$/g, "").trim();
  return item;
}

export function parseIngredientLine(raw: string): ParsedIngredient {
  const original = raw.replace(/\s+/g, " ").trim();
  const notes: string[] = [];
  let optional = false;
  let working = original;

  if (OPTIONAL.test(working)) {
    optional = true;
    working = working.replace(OPTIONAL, " ");
  }

  const parens: string[] = [];
  working = working.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    parens.push(inner.trim());
    return " ";
  });

  let quantity: number | null = null;
  const leading = parseNumberToken(working);
  if (leading) {
    quantity = leading.qty;
    working = leading.rest;
    const range = original.match(/(\d+(?:[.,]\d+)?)\s*(?:à|a|-|–)\s*(\d+(?:[.,]\d+)?)/);
    if (range) notes.push(range[0]);
  }

  let unit = "";
  const parsedUnit = parseUnit(working);
  if (parsedUnit) {
    unit = parsedUnit.unit;
    working = parsedUnit.rest;
  } else if (quantity != null) {
    unit = "ct";
  }

  for (const note of parens) {
    const measure = measureInParens(note);
    if (measure && (unit === "can" || unit === "ct")) {
      notes.push(unit);
      quantity = measure.quantity;
      unit = measure.unit;
    } else if (note) {
      notes.push(note);
    }
  }

  let item = cleanItem(working);
  if (!item) item = original;
  let matched = matchIngredientName(item);
  if (!matched) {
    const stripped = cleanItem(item.replace(PREP_WORDS, " "));
    if (stripped && stripped !== item) {
      matched = matchIngredientName(stripped);
      if (matched) item = stripped;
    }
  }
  const def = matched ? getIngredient(matched.itemKey) : undefined;

  return {
    raw: original,
    quantity: quantity == null ? null : roundQty(quantity),
    unit,
    item,
    itemKey: matched?.itemKey ?? "",
    notes: notes.filter(Boolean).join(", "),
    optional,
    displayFr: def?.fr ?? item,
    displayEn: def?.en ?? item,
  };
}

export function parseIngredientLines(lines: string[]): ParsedIngredient[] {
  return lines.map((line) => line.trim()).filter(Boolean).map(parseIngredientLine);
}
