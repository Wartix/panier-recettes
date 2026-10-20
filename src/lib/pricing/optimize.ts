import { priceAgainstOffer, type Offer } from "@/lib/pricing/cost";

export type BasketItem = {
  itemKey: string;
  name: string;
  quantity: number;
  unit: string;
};

export type AssignedItem = {
  itemKey: string;
  name: string;
  costCents: number;
  estimate: boolean;
  productName: string;
  storeId: string;
};

export type StorePick = {
  storeId: string;
  items: AssignedItem[];
  subtotalCents: number;
};

export type BasketPlan = {
  storeIds: string[];
  picks: StorePick[];
  totalCents: number;
  estimateCents: number;
  missing: string[];
  complete: boolean;
};

function combinations<T>(values: T[], size: number): T[][] {
  if (size <= 0) return [[]];
  if (size > values.length) return [];
  const out: T[][] = [];
  const walk = (start: number, picked: T[]) => {
    if (picked.length === size) {
      out.push([...picked]);
      return;
    }
    for (let index = start; index < values.length; index += 1) {
      picked.push(values[index]);
      walk(index + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return out;
}

function evaluate(items: BasketItem[], storeIds: string[], offers: Offer[], estimates: Offer[]): BasketPlan {
  const picks = new Map<string, AssignedItem[]>();
  for (const storeId of storeIds) picks.set(storeId, []);
  const missing: string[] = [];
  let estimateCents = 0;

  for (const item of items) {
    let best: { storeId: string; cents: number; productName: string; estimate: boolean } | null = null;
    for (const storeId of storeIds) {
      for (const offer of offers) {
        if (offer.storeId !== storeId || offer.itemKey !== item.itemKey || offer.estimate) continue;
        const cents = priceAgainstOffer(item.itemKey, item.quantity, item.unit, offer, "buy");
        if (cents == null) continue;
        if (!best || cents < best.cents) {
          best = { storeId, cents, productName: offer.productName, estimate: false };
        }
      }
    }
    if (!best) {
      for (const offer of estimates) {
        if (offer.itemKey !== item.itemKey) continue;
        const cents = priceAgainstOffer(item.itemKey, item.quantity, item.unit, offer, "buy");
        if (cents == null) continue;
        if (!best || cents < best.cents) {
          best = { storeId: storeIds[0] ?? "statcan", cents, productName: offer.productName, estimate: true };
        }
      }
    }
    if (!best) {
      missing.push(item.name);
      continue;
    }
    const bucket = best.estimate ? "statcan" : best.storeId;
    const list = picks.get(bucket) ?? [];
    list.push({
      itemKey: item.itemKey,
      name: item.name,
      costCents: best.cents,
      estimate: best.estimate,
      productName: best.productName,
      storeId: bucket,
    });
    picks.set(bucket, list);
    if (best.estimate) estimateCents += best.cents;
  }

  const planPicks: StorePick[] = [];
  for (const [storeId, assigned] of picks) {
    if (!assigned.length) continue;
    planPicks.push({
      storeId,
      items: assigned,
      subtotalCents: assigned.reduce((sum, item) => sum + item.costCents, 0),
    });
  }
  const totalCents = planPicks.reduce((sum, pick) => sum + pick.subtotalCents, 0);
  const realStores = planPicks.filter((pick) => pick.storeId !== "statcan").map((pick) => pick.storeId);
  return {
    storeIds: realStores,
    picks: planPicks,
    totalCents,
    estimateCents,
    missing,
    complete: missing.length === 0,
  };
}

function better(candidate: BasketPlan, current: BasketPlan | null): boolean {
  if (!current) return true;
  if (candidate.complete !== current.complete) return candidate.complete;
  if (candidate.missing.length !== current.missing.length) return candidate.missing.length < current.missing.length;
  if (candidate.estimateCents !== current.estimateCents && candidate.totalCents === current.totalCents) {
    return candidate.estimateCents < current.estimateCents;
  }
  if (candidate.totalCents !== current.totalCents) return candidate.totalCents < current.totalCents;
  return candidate.storeIds.length < current.storeIds.length;
}

export function optimizeBasket(input: {
  items: BasketItem[];
  offers: Offer[];
  estimates?: Offer[];
  maxStores?: number;
}): { single: BasketPlan | null; split: BasketPlan | null; plans: BasketPlan[] } {
  const items = input.items.filter((item) => item.quantity > 0 && item.unit && item.itemKey);
  const stores = [...new Set(input.offers.filter((offer) => !offer.estimate).map((offer) => offer.storeId))];
  const estimates = input.estimates ?? [];
  const maxStores = Math.min(input.maxStores ?? 3, 3, stores.length);
  const plans: BasketPlan[] = [];
  if (!stores.length && estimates.length) {
    plans.push(evaluate(items, [], input.offers, estimates));
  }

  for (let size = 1; size <= Math.max(maxStores, stores.length ? 1 : 0); size += 1) {
    if (size > 3) break;
    for (const combo of combinations(stores, size)) {
      plans.push(evaluate(items, combo, input.offers, estimates));
    }
  }

  plans.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (a.totalCents !== b.totalCents) return a.totalCents - b.totalCents;
    if (a.storeIds.length !== b.storeIds.length) return a.storeIds.length - b.storeIds.length;
    return a.estimateCents - b.estimateCents;
  });

  let single: BasketPlan | null = null;
  let split: BasketPlan | null = null;
  for (const plan of plans) {
    if (plan.storeIds.length <= 1 && better(plan, single)) single = plan;
    if (plan.storeIds.length >= 2 && better(plan, split)) split = plan;
  }

  return { single, split, plans: plans.slice(0, 8) };
}
