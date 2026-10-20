import { inferCategory } from "@/lib/categories";
import { matchIngredientName } from "@/lib/ingredients/match";

export type ParsedReceiptLine = {
  name: string;
  quantity: number;
  unit: string;
  priceCents: number;
  category: string;
  itemKey: string;
};

export type ParsedReceipt = {
  storeId: string;
  storeName: string;
  lines: ParsedReceiptLine[];
  totalCents: number | null;
};

const NOISE =
  /^(sous[-\s]?total|subtotal|total|tps|tvq|gst|qst|taxe|visa|mastercard|debit|comptant|cash|monnaie|change|merci|tps\/tvq|economisez|vous economisez)\b/i;
const PRICE = /(\d{1,4})[.,](\d{2})\s*$/;
const WEIGHT = /^(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs)\b.*@/i;

const STORES: [RegExp, string, string][] = [
  [/\bmaxi\b/i, "maxi", "Maxi"],
  [/\bprovigo\b/i, "provigo", "Provigo"],
  [/\biga\b/i, "iga", "IGA"],
  [/\bsuper\s*c\b/i, "superc", "Super C"],
  [/\bmetro\b/i, "metro", "Metro"],
  [/\bwalmart\b/i, "walmart", "Walmart"],
  [/\bcostco\b/i, "costco", "Costco"],
];

function titleCase(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  return clean
    .toLowerCase()
    .replace(/(^|[\s\-/])([a-zà-ÿ])/g, (_, boundary: string, char: string) => boundary + char.toUpperCase());
}

function cents(match: RegExpMatchArray): number {
  return Number(match[1]) * 100 + Number(match[2]);
}

export function parseReceipt(text: string): ParsedReceipt {
  const rawLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = rawLines.slice(0, 6).join(" ");
  const store = STORES.find(([rule]) => rule.test(header) || rule.test(text.slice(0, 400)));
  const lines: ParsedReceiptLine[] = [];
  let pending = "";
  let totalCents: number | null = null;

  for (const line of rawLines) {
    const compact = line.replace(/\s+/g, " ");
    if (NOISE.test(compact)) {
      if (/^total\b/i.test(compact)) {
        const total = compact.match(PRICE);
        if (total) totalCents = cents(total);
      }
      pending = "";
      continue;
    }
    const price = compact.match(PRICE);
    const weight = compact.match(WEIGHT);
    if (weight && price) {
      const name = titleCase(pending || compact.replace(PRICE, "").replace(WEIGHT, "").trim() || "Article");
      const matched = matchIngredientName(name);
      lines.push({
        name,
        quantity: Number(weight[1].replace(",", ".")),
        unit: weight[2].toLowerCase() === "lbs" ? "lb" : weight[2].toLowerCase(),
        priceCents: cents(price),
        category: inferCategory(name),
        itemKey: matched?.itemKey ?? "",
      });
      pending = "";
      continue;
    }
    if (!price) {
      if (/[a-zà-ÿ]{3,}/i.test(compact) && compact.length < 60) pending = compact;
      continue;
    }
    const body = compact.replace(PRICE, "").trim();
    if (!/[a-zà-ÿ]{3,}/i.test(body) && pending) {
      const name = titleCase(pending);
      const matched = matchIngredientName(name);
      lines.push({
        name,
        quantity: 1,
        unit: "ct",
        priceCents: cents(price),
        category: inferCategory(name),
        itemKey: matched?.itemKey ?? "",
      });
      pending = "";
      continue;
    }
    if (!/[a-zà-ÿ]{3,}/i.test(body)) continue;
    const name = titleCase(body);
    const matched = matchIngredientName(name);
    lines.push({
      name,
      quantity: 1,
      unit: "ct",
      priceCents: cents(price),
      category: inferCategory(name),
      itemKey: matched?.itemKey ?? "",
    });
    pending = "";
  }

  if (totalCents == null && lines.length) {
    totalCents = lines.reduce((sum, line) => sum + line.priceCents, 0);
  }
  return {
    storeId: store?.[1] ?? "",
    storeName: store?.[2] ?? "",
    lines,
    totalCents,
  };
}
