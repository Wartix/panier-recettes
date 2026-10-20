import { getIngredient } from "@/lib/ingredients/dictionary";
import { toBase, type BaseQty, type UnitKind } from "@/lib/ingredients/units";

export type Need = {
  itemKey: string;
  name: string;
  quantity: number | null;
  unit: string;
  optional?: boolean;
};

export type PantryStock = {
  itemKey: string;
  quantity: number;
  unit: string;
};

export type Offer = {
  storeId: string;
  itemKey: string;
  productName: string;
  priceCents: number;
  packageQty: number;
  packageUnit: string;
  loose: boolean;
  estimate?: boolean;
};

export type CostLine = {
  itemKey: string;
  name: string;
  quantity: number | null;
  unit: string;
  optional: boolean;
  missingQty: number;
  haveQty: number;
  buyCostCents: number | null;
  fullCostCents: number | null;
  storeId: string | null;
  productName: string | null;
  estimate: boolean;
  priced: boolean;
};

export type RecipeCost = {
  lines: CostLine[];
  buyCostCents: number;
  fullCostCents: number;
  perServingBuyCents: number;
  perServingFullCents: number;
  unpriced: string[];
  servings: number;
};

type Canon = { amount: number; kind: UnitKind };

export function canonicalQty(quantity: number, unit: string, itemKey: string): Canon | null {
  const base: BaseQty | null = toBase(quantity, unit, itemKey);
  if (!base) return null;
  const density = getIngredient(itemKey)?.density;
  if (base.kind === "volume" && density) return { amount: base.amount * density, kind: "mass" };
  return base;
}

export function priceAgainstOffer(
  itemKey: string,
  quantity: number,
  unit: string,
  offer: Offer,
  mode: "buy" | "prorate",
): number | null {
  if (quantity <= 0) return 0;
  const need = canonicalQty(quantity, unit, itemKey);
  const pack = canonicalQty(offer.packageQty, offer.packageUnit, itemKey);
  if (!need || !pack || need.kind !== pack.kind || pack.amount <= 0) return null;
  if (mode === "prorate" || offer.loose) {
    return Math.round((offer.priceCents / pack.amount) * need.amount);
  }
  const packs = Math.ceil(need.amount / pack.amount - 1e-9);
  return packs * offer.priceCents;
}

function stockAmount(itemKey: string, pantry: PantryStock[], kind: UnitKind): number {
  let total = 0;
  for (const item of pantry) {
    if (item.itemKey !== itemKey) continue;
    const canon = canonicalQty(item.quantity, item.unit, itemKey);
    if (!canon || canon.kind !== kind) continue;
    total += canon.amount;
  }
  return total;
}

export function cheapestOffer(
  itemKey: string,
  quantity: number,
  unit: string,
  offers: Offer[],
  mode: "buy" | "prorate",
): { offer: Offer; cents: number } | null {
  let best: { offer: Offer; cents: number } | null = null;
  for (const offer of offers) {
    if (offer.itemKey !== itemKey) continue;
    const cents = priceAgainstOffer(itemKey, quantity, unit, offer, mode);
    if (cents == null) continue;
    if (!best) {
      best = { offer, cents };
      continue;
    }
    const preferReal = Boolean(best.offer.estimate) && !offer.estimate && cents === best.cents;
    if (cents < best.cents || preferReal) best = { offer, cents };
  }
  return best;
}

export function costNeeds(input: { needs: Need[]; pantry: PantryStock[]; offers: Offer[]; servings: number }): RecipeCost {
  const lines: CostLine[] = [];
  let buy = 0;
  let full = 0;
  const unpriced: string[] = [];

  for (const need of input.needs) {
    const optional = Boolean(need.optional);
    if (optional || need.quantity == null || need.quantity <= 0 || !need.unit) {
      lines.push({
        itemKey: need.itemKey,
        name: need.name,
        quantity: need.quantity,
        unit: need.unit,
        optional,
        missingQty: 0,
        haveQty: 0,
        buyCostCents: 0,
        fullCostCents: 0,
        storeId: null,
        productName: null,
        estimate: false,
        priced: true,
      });
      continue;
    }

    const canon = canonicalQty(need.quantity, need.unit, need.itemKey);
    const have = canon ? stockAmount(need.itemKey, input.pantry, canon.kind) : 0;
    const missingAmount = canon ? Math.max(0, canon.amount - have) : need.quantity;
    const missingQty = canon && canon.amount > 0 ? (missingAmount / canon.amount) * need.quantity : 0;

    const fullPick = cheapestOffer(need.itemKey, need.quantity, need.unit, input.offers, "prorate");
    const buyPick =
      missingQty <= 0.0001
        ? null
        : cheapestOffer(need.itemKey, missingQty, need.unit, input.offers, "buy");

    if (!fullPick) unpriced.push(need.name);

    const buyCost = missingQty <= 0.0001 ? 0 : (buyPick?.cents ?? null);
    const fullCost = fullPick?.cents ?? null;
    if (buyCost != null) buy += buyCost;
    if (fullCost != null) full += fullCost;

    lines.push({
      itemKey: need.itemKey,
      name: need.name,
      quantity: need.quantity,
      unit: need.unit,
      optional: false,
      missingQty: Math.round(missingQty * 1000) / 1000,
      haveQty: Math.round((need.quantity - missingQty) * 1000) / 1000,
      buyCostCents: buyCost,
      fullCostCents: fullCost,
      storeId: (buyPick ?? fullPick)?.offer.storeId ?? null,
      productName: (buyPick ?? fullPick)?.offer.productName ?? null,
      estimate: Boolean((buyPick ?? fullPick)?.offer.estimate),
      priced: fullPick != null,
    });
  }

  const servings = input.servings > 0 ? input.servings : 1;
  return {
    lines,
    buyCostCents: buy,
    fullCostCents: full,
    perServingBuyCents: Math.round(buy / servings),
    perServingFullCents: Math.round(full / servings),
    unpriced,
    servings,
  };
}

export function aggregateNeeds(needs: Need[]): Need[] {
  const grouped = new Map<string, Need>();
  for (const need of needs) {
    if (!need.itemKey || need.optional || need.quantity == null || need.quantity <= 0 || !need.unit) continue;
    const key = `${need.itemKey}|${need.unit}`;
    const existing = grouped.get(key);
    if (!existing) grouped.set(key, { ...need, optional: false });
    else existing.quantity = (existing.quantity ?? 0) + need.quantity;
  }
  return [...grouped.values()];
}

export function scaleQuantity(quantity: number | null, fromServings: number, toServings: number): number | null {
  if (quantity == null) return null;
  if (!fromServings) return quantity;
  return Math.round(quantity * (toServings / fromServings) * 1000) / 1000;
}
