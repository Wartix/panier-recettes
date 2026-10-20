import { getIngredient } from "@/lib/ingredients/dictionary";

export type UnitKind = "mass" | "volume" | "count";

export type BaseQty = {
  amount: number;
  kind: UnitKind;
};

type UnitDef = {
  kind: UnitKind;
  /** Multiply a quantity in this unit to reach grams, millilitres, or a count. */
  factor: number;
};

export const UNITS: Record<string, UnitDef> = {
  g: { kind: "mass", factor: 1 },
  kg: { kind: "mass", factor: 1000 },
  oz: { kind: "mass", factor: 28.3495 },
  lb: { kind: "mass", factor: 453.592 },
  ml: { kind: "volume", factor: 1 },
  cl: { kind: "volume", factor: 10 },
  l: { kind: "volume", factor: 1000 },
  cup: { kind: "volume", factor: 240 },
  tasse: { kind: "volume", factor: 250 },
  tbsp: { kind: "volume", factor: 15 },
  tsp: { kind: "volume", factor: 5 },
  floz: { kind: "volume", factor: 29.5735 },
  ct: { kind: "count", factor: 1 },
  clove: { kind: "count", factor: 1 },
  pinch: { kind: "count", factor: 1 },
  can: { kind: "count", factor: 1 },
  bunch: { kind: "count", factor: 1 },
  slice: { kind: "count", factor: 1 },
};

export function toBase(quantity: number, unit: string, itemKey?: string): BaseQty | null {
  if (!Number.isFinite(quantity)) return null;
  const id = unit.trim().toLowerCase();
  if (!id) {
    if (quantity === 0) return { amount: 0, kind: "count" };
    return null;
  }
  const def = UNITS[id];
  if (!def) return null;
  if (def.kind === "mass") return { amount: quantity * def.factor, kind: "mass" };
  if (def.kind === "volume") return { amount: quantity * def.factor, kind: "volume" };
  const ingredient = itemKey ? getIngredient(itemKey) : undefined;
  if (id === "ct" && ingredient?.pieceGrams) {
    return { amount: quantity * ingredient.pieceGrams, kind: "mass" };
  }
  return { amount: quantity * def.factor, kind: "count" };
}

export function alignQuantities(
  left: BaseQty,
  right: BaseQty,
  itemKey?: string,
): { left: number; right: number } | null {
  if (left.kind === right.kind) return { left: left.amount, right: right.amount };
  const density = itemKey ? getIngredient(itemKey)?.density : undefined;
  if (!density) return null;
  if (left.kind === "mass" && right.kind === "volume") {
    return { left: left.amount, right: right.amount * density };
  }
  if (left.kind === "volume" && right.kind === "mass") {
    return { left: left.amount * density, right: right.amount };
  }
  return null;
}

/** Convert `quantity` from `from` into `to` when the units are compatible. */
export function convert(quantity: number, from: string, to: string, itemKey?: string): number | null {
  const a = toBase(quantity, from, itemKey);
  const b = toBase(1, to, itemKey);
  if (!a || !b) return null;
  const aligned = alignQuantities(a, b, itemKey);
  if (!aligned || aligned.right === 0) return null;
  return aligned.left / aligned.right;
}
