import { prisma } from "@/lib/db";
import { expiryUrgency, weekStartISO, type ExpiryUrgency } from "@/lib/format";
import { getIngredient } from "@/lib/ingredients/dictionary";
import { aggregateNeeds, costNeeds, scaleQuantity, type Need, type Offer, type PantryStock } from "@/lib/pricing/cost";
import { optimizeBasket, type BasketPlan } from "@/lib/pricing/optimize";
import { storeName } from "@/lib/stores";

export type Market = { offers: Offer[]; estimates: Offer[] };

export async function loadMarket(): Promise<Market> {
  const products = await prisma.catalogProduct.findMany({
    include: { observations: { orderBy: { observedAt: "desc" }, take: 1 } },
  });
  const offers: Offer[] = [];
  const estimates: Offer[] = [];
  for (const product of products) {
    const latest = product.observations[0];
    if (!latest || product.packageQty == null || !product.packageUnit || !product.itemKey) continue;
    const offer: Offer = {
      storeId: product.storeId,
      itemKey: product.itemKey,
      productName: product.name,
      priceCents: latest.priceCents,
      packageQty: product.packageQty,
      packageUnit: product.packageUnit,
      loose: product.loose,
      estimate: product.storeId === "statcan" || latest.source === "statcan",
    };
    if (offer.estimate) estimates.push(offer);
    else offers.push(offer);
  }
  return { offers, estimates };
}

async function loadPantryStock(userId: string): Promise<PantryStock[]> {
  const items = await prisma.pantryItem.findMany({ where: { userId } });
  return items.filter((item) => item.itemKey && item.unit).map((item) => ({
    itemKey: item.itemKey,
    quantity: item.quantity,
    unit: item.unit,
  }));
}

function recipeNeeds(ingredients: { itemKey: string; item?: string; displayFr?: string; quantity: number | null; unit: string; optional: boolean }[], scale = 1): Need[] {
  return ingredients.map((ingredient) => ({
    itemKey: ingredient.itemKey,
    name: ingredient.displayFr ?? getIngredient(ingredient.itemKey)?.fr ?? ingredient.item ?? ingredient.itemKey,
    quantity: scaleQuantity(ingredient.quantity, 1, scale),
    unit: ingredient.unit,
    optional: ingredient.optional,
  }));
}

export async function loadHome(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const week = weekStartISO();
  const [pantry, meals, alerts, grocery, market] = await Promise.all([
    prisma.pantryItem.findMany({ where: { userId }, orderBy: { expiryDate: "asc" } }),
    prisma.mealEntry.findMany({ where: { userId, weekStart: week }, include: { recipe: true }, orderBy: { dayIndex: "asc" } }),
    prisma.saleAlert.findMany({ where: { userId, read: false }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.groceryItem.findMany({ where: { userId, checked: false } }),
    loadMarket(),
  ]);
  const plan = optimizeBasket({
    items: grocery.filter((item) => item.itemKey && item.unit).map((item) => ({
      itemKey: item.itemKey,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })),
    offers: market.offers,
    estimates: market.estimates,
  });
  return {
    name: user.name,
    postalCode: user.postalCode,
    week,
    expiring: pantry
      .map((item) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        urgency: expiryUrgency(item.expiryDate),
      }))
      .filter((item) => item.urgency === "expired" || item.urgency === "today" || item.urgency === "soon"),
    meals: meals.map((meal) => ({
      id: meal.id,
      dayIndex: meal.dayIndex,
      meal: meal.meal,
      servings: meal.servings,
      recipeId: meal.recipeId,
      title: meal.recipe.title,
      titleEn: meal.recipe.titleEn,
      cuisine: meal.recipe.cuisine,
    })),
    alerts: alerts.map((alert) => ({
      id: alert.id,
      itemKey: alert.itemKey,
      productName: alert.productName,
      storeId: alert.storeId,
      store: storeName(alert.storeId),
      priceCents: alert.priceCents,
      usualPriceCents: alert.usualPriceCents,
    })),
    groceryCount: grocery.length,
    single: summarize(plan.single),
    split: summarize(plan.split),
  };
}

function summarize(plan: BasketPlan | null) {
  if (!plan) return null;
  return {
    storeIds: plan.storeIds,
    stores: plan.storeIds.map(storeName),
    totalCents: plan.totalCents,
    estimateCents: plan.estimateCents,
    complete: plan.complete,
    missing: plan.missing,
  };
}

export async function loadRecipes(userId: string) {
  const [recipes, pantry, market] = await Promise.all([
    prisma.recipe.findMany({ where: { userId }, include: { ingredients: true }, orderBy: { title: "asc" } }),
    loadPantryStock(userId),
    loadMarket(),
  ]);
  return recipes.map((recipe) => {
    const cost = costNeeds({
      needs: recipeNeeds(recipe.ingredients),
      pantry,
      offers: [...market.offers, ...market.estimates],
      servings: recipe.servings,
    });
    return {
      id: recipe.id,
      title: recipe.title,
      titleEn: recipe.titleEn,
      description: recipe.description,
      descriptionEn: recipe.descriptionEn,
      cuisine: recipe.cuisine,
      origin: recipe.origin,
      servings: recipe.servings,
      minutes: recipe.prepMinutes + recipe.cookMinutes,
      perServingBuyCents: cost.perServingBuyCents,
      perServingFullCents: cost.perServingFullCents,
      missing: cost.lines.filter((line) => line.missingQty > 0.05).length,
    };
  });
}

export async function loadRecipe(userId: string, id: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id, userId }, include: { ingredients: { orderBy: { position: "asc" } } } });
  if (!recipe) return null;
  const [pantry, market] = await Promise.all([loadPantryStock(userId), loadMarket()]);
  const ingredients = recipe.ingredients.map((ingredient) => ({
    id: ingredient.id,
    raw: ingredient.raw,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    itemKey: ingredient.itemKey,
    optional: ingredient.optional,
    notes: ingredient.notes,
    displayFr: getIngredient(ingredient.itemKey)?.fr ?? ingredient.item,
    displayEn: getIngredient(ingredient.itemKey)?.en ?? ingredient.item,
  }));
  const cost = costNeeds({
    needs: recipeNeeds(ingredients),
    pantry,
    offers: [...market.offers, ...market.estimates],
    servings: recipe.servings,
  });
  return {
    id: recipe.id,
    title: recipe.title,
    titleEn: recipe.titleEn,
    description: recipe.description,
    descriptionEn: recipe.descriptionEn,
    cuisine: recipe.cuisine,
    origin: recipe.origin,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    steps: JSON.parse(recipe.steps) as string[],
    stepsEn: JSON.parse(recipe.stepsEn || "[]") as string[],
    sourceUrl: recipe.sourceUrl,
    ingredients,
    pantry,
    offers: [...market.offers, ...market.estimates],
    cost,
  };
}

export async function loadPantry(userId: string) {
  const items = await prisma.pantryItem.findMany({ where: { userId }, orderBy: [{ location: "asc" }, { name: "asc" }] });
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    location: item.location,
    expiry: item.expiryDate ? item.expiryDate.toISOString() : null,
    urgency: expiryUrgency(item.expiryDate) as ExpiryUrgency,
    priceCents: item.priceCents,
    storeId: item.storeId,
  }));
}

export async function loadGrocery(userId: string) {
  const [items, market] = await Promise.all([
    prisma.groceryItem.findMany({ where: { userId }, orderBy: [{ checked: "asc" }, { category: "asc" }, { name: "asc" }] }),
    loadMarket(),
  ]);
  const open = items.filter((item) => !item.checked && item.itemKey && item.unit);
  const plan = optimizeBasket({
    items: open.map((item) => ({ itemKey: item.itemKey, name: item.name, quantity: item.quantity, unit: item.unit })),
    offers: market.offers,
    estimates: market.estimates,
  });
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: item.checked,
      source: item.source,
      itemKey: item.itemKey,
    })),
    single: plan.single,
    split: plan.split,
  };
}

export async function loadPrices(userId: string) {
  const [alerts, cache, products] = await Promise.all([
    prisma.saleAlert.findMany({ where: { userId, read: false }, orderBy: { createdAt: "desc" } }),
    prisma.scrapeCache.findUnique({ where: { key: "adapter-status" } }),
    prisma.catalogProduct.findMany({
      where: { storeId: { not: "statcan" }, itemKey: { not: "" } },
      include: { observations: { orderBy: { observedAt: "asc" } } },
    }),
  ]);
  const keys = new Set(alerts.map((alert) => alert.itemKey));
  for (const product of products) {
    if (product.observations.some((point) => point.onSale)) keys.add(product.itemKey);
  }
  const tracked = ["ground_beef", "butter", "chicken_breast", "milk", "egg", "canned_tomato"];
  for (const key of tracked) keys.add(key);
  const series = products
    .filter((product) => keys.has(product.itemKey))
    .map((product) => ({
      itemKey: product.itemKey,
      name: getIngredient(product.itemKey)?.fr ?? product.name,
      nameEn: getIngredient(product.itemKey)?.en ?? product.name,
      storeId: product.storeId,
      store: storeName(product.storeId),
      productName: product.name,
      source: product.observations.at(-1)?.source ?? "seed",
      points: product.observations.map((point) => ({
        at: point.observedAt.toISOString().slice(0, 10),
        priceCents: point.priceCents,
        onSale: point.onSale,
        source: point.source,
      })),
    }));
  let adapters: { storeId: string; displayName: string; state: string; detail: string; count: number }[] = [];
  if (cache) {
    try {
      const parsed = JSON.parse(cache.payload) as { reports?: typeof adapters };
      adapters = parsed.reports ?? [];
    } catch {
      adapters = [];
    }
  }
  const longest = new Map<string, (typeof series)[number]>();
  for (const item of series) {
    const key = `${item.itemKey}|${item.storeId}`;
    const existing = longest.get(key);
    if (!existing || item.points.length > existing.points.length) longest.set(key, item);
  }
  return {
    alerts: alerts.map((alert) => ({
      id: alert.id,
      itemKey: alert.itemKey,
      productName: alert.productName,
      storeId: alert.storeId,
      store: storeName(alert.storeId),
      priceCents: alert.priceCents,
      usualPriceCents: alert.usualPriceCents,
    })),
    series: [...longest.values()],
    adapters,
  };
}

export async function loadPlan(userId: string) {
  const week = weekStartISO();
  const [meals, recipes] = await Promise.all([
    prisma.mealEntry.findMany({ where: { userId, weekStart: week }, include: { recipe: true } }),
    prisma.recipe.findMany({ where: { userId }, select: { id: true, title: true, titleEn: true, servings: true }, orderBy: { title: "asc" } }),
  ]);
  return {
    week,
    meals: meals.map((meal) => ({
      id: meal.id,
      dayIndex: meal.dayIndex,
      meal: meal.meal,
      servings: meal.servings,
      recipeId: meal.recipeId,
      title: meal.recipe.title,
      titleEn: meal.recipe.titleEn,
    })),
    recipes,
  };
}

export async function addMissingToGrocery(userId: string, needs: Need[], source: string, recipeId = "") {
  const [pantry, market] = await Promise.all([loadPantryStock(userId), loadMarket()]);
  const lines = costNeeds({
    needs: aggregateNeeds(needs),
    pantry,
    offers: [...market.offers, ...market.estimates],
    servings: 1,
  }).lines.filter((line) => line.missingQty > 0.05 && line.itemKey);
  let added = 0;
  for (const line of lines) {
    const existing = await prisma.groceryItem.findFirst({
      where: { userId, itemKey: line.itemKey, unit: line.unit, checked: false },
    });
    if (existing) continue;
    const def = getIngredient(line.itemKey);
    await prisma.groceryItem.create({
      data: {
        userId,
        name: def?.fr ?? line.name,
        itemKey: line.itemKey,
        quantity: Math.round(line.missingQty * 100) / 100,
        unit: line.unit,
        category: def?.category ?? "other",
        source,
        recipeId,
      },
    });
    added += 1;
  }
  return added;
}
