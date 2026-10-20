import bcrypt from "bcryptjs";
import statcanData from "../../../data/statcan-quebec.json";
import { prisma } from "@/lib/db";
import { inferCategory } from "@/lib/categories";
import { getIngredient } from "@/lib/ingredients/dictionary";
import { parseIngredientLine } from "@/lib/ingredients/parse";
import { aggregateNeeds, costNeeds, type Need, type PantryStock } from "@/lib/pricing/cost";
import { optimizeBasket } from "@/lib/pricing/optimize";
import { refreshAlerts } from "@/lib/pricing/persist";
import { weekStartISO } from "@/lib/format";
import { SEED_PRICES, SEED_STORES } from "@/lib/seed/catalog";
import { SEED_PANTRY, SEED_PLAN, SEED_RECIPES } from "@/lib/seed/recipes";

const DEMO_EMAIL = "demo@panierrecettes.ca";
const DEMO_PASSWORD = "laval-demo";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function weeksAgo(weeks: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - weeks * 7);
  return date;
}

function wobble(cents: number, weeks: number): number {
  const delta = ((weeks * 17) % 7) - 3;
  return Math.max(1, Math.round(cents * (1 + delta / 100)));
}

export async function seedKitchen() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 8);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: "Camille",
      passwordHash,
      locale: "fr",
      postalCode: "H7T2P1",
    },
    update: { name: "Camille", passwordHash, locale: "fr", postalCode: "H7T2P1" },
  });

  await prisma.saleAlert.deleteMany({ where: { userId: user.id } });
  await prisma.mealEntry.deleteMany({ where: { userId: user.id } });
  await prisma.groceryItem.deleteMany({ where: { userId: user.id } });
  await prisma.pantryItem.deleteMany({ where: { userId: user.id } });
  await prisma.receipt.deleteMany({ where: { userId: user.id } });
  await prisma.recipe.deleteMany({ where: { userId: user.id } });
  await prisma.catalogProduct.deleteMany({
    where: { OR: [{ externalId: { startsWith: "seed-" } }, { externalId: { startsWith: "statcan-" } }] },
  });

  const recipeIds = new Map<string, { id: string; servings: number; needs: Need[] }>();

  for (const recipe of SEED_RECIPES) {
    const created = await prisma.recipe.create({
      data: {
        userId: user.id,
        title: recipe.title,
        titleEn: recipe.titleEn,
        description: recipe.description,
        descriptionEn: recipe.descriptionEn,
        cuisine: recipe.cuisine,
        origin: recipe.origin,
        language: "fr",
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        steps: JSON.stringify(recipe.steps),
        stepsEn: JSON.stringify(recipe.stepsEn),
        tags: recipe.tags,
        ingredients: {
          create: recipe.lines.map((line, position) => {
            const parsed = parseIngredientLine(line);
            return {
              position,
              raw: line,
              quantity: parsed.quantity,
              unit: parsed.unit,
              item: parsed.item,
              itemKey: parsed.itemKey,
              notes: parsed.notes,
              optional: parsed.optional,
            };
          }),
        },
      },
      include: { ingredients: true },
    });
    recipeIds.set(recipe.title, {
      id: created.id,
      servings: created.servings,
      needs: created.ingredients.map((ingredient) => ({
        itemKey: ingredient.itemKey,
        name: getIngredient(ingredient.itemKey)?.fr ?? ingredient.item,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        optional: ingredient.optional,
      })),
    });
  }

  const pantry: PantryStock[] = [];
  for (const item of SEED_PANTRY) {
    const parsed = parseIngredientLine(item.line);
    const quantity = "quantity" in item && item.quantity ? item.quantity : (parsed.quantity ?? 1);
    const unit = "unit" in item && item.unit ? item.unit : parsed.unit || "ct";
    const itemKey = "itemKey" in item && item.itemKey ? item.itemKey : parsed.itemKey;
    await prisma.pantryItem.create({
      data: {
        userId: user.id,
        name: item.name,
        itemKey,
        quantity,
        unit,
        category: inferCategory(item.name),
        location: item.location,
        purchaseDate: daysFromNow(-4),
        expiryDate: item.days == null ? null : daysFromNow(item.days),
        priceCents: itemKey === "milk" ? 529 : itemKey === "butter" ? 499 : null,
        storeId: itemKey === "milk" || itemKey === "butter" ? "maxi" : "",
      },
    });
    if (itemKey && unit) pantry.push({ itemKey, quantity, unit });
  }

  for (const entry of SEED_PLAN) {
    const recipe = recipeIds.get(entry.recipe);
    if (!recipe) continue;
    await prisma.mealEntry.create({
      data: {
        userId: user.id,
        recipeId: recipe.id,
        weekStart: weekStartISO(),
        dayIndex: entry.dayIndex,
        meal: entry.meal,
        servings: recipe.servings,
      },
    });
  }

  for (const price of SEED_PRICES) {
    for (let index = 0; index < SEED_STORES.length; index += 1) {
      const storeId = SEED_STORES[index];
      const regular = price.prices[index];
      const onSale = price.sale?.store === storeId;
      const latest = onSale ? price.sale!.cents : regular;
      const product = await prisma.catalogProduct.create({
        data: {
          storeId,
          externalId: `seed-${storeId}-${price.itemKey}`,
          name: price.name,
          itemKey: price.itemKey,
          packageQty: price.packageQty,
          packageUnit: price.packageUnit,
          loose: price.loose,
          sizeText: price.loose ? `/${price.packageQty}${price.packageUnit}` : `${price.packageQty} ${price.packageUnit}`,
        },
      });
      const points = [];
      for (let weeks = 8; weeks >= 1; weeks -= 1) {
        points.push({ weeks, cents: wobble(regular, weeks), onSale: false });
      }
      points.push({ weeks: 0, cents: latest, onSale });
      await prisma.priceObservation.createMany({
        data: points.map((point) => ({
          productId: product.id,
          storeId,
          postalCode: "H7T2P1",
          observedAt: weeksAgo(point.weeks),
          priceCents: point.cents,
          regularPriceCents: onSale && point.weeks === 0 ? regular : null,
          onSale: point.onSale,
          source: "seed",
        })),
      });
    }
  }

  for (const series of statcanData.series) {
    const product = await prisma.catalogProduct.create({
      data: {
        storeId: "statcan",
        externalId: `statcan-${series.itemKey}`,
        name: series.product,
        itemKey: series.itemKey,
        packageQty: series.packageQty,
        packageUnit: series.packageUnit,
        loose: series.loose,
        sizeText: "moyenne mensuelle, Québec",
      },
    });
    await prisma.priceObservation.createMany({
      data: series.points.map((point) => ({
        productId: product.id,
        storeId: "statcan",
        postalCode: "QC",
        observedAt: new Date(`${point.date}-15T12:00:00.000Z`),
        priceCents: Math.round(point.value * 100),
        onSale: false,
        source: "statcan",
        unitPriceBasis: series.product,
      })),
    });
  }

  const planNeeds = SEED_PLAN.flatMap((entry) => recipeIds.get(entry.recipe)?.needs ?? []);
  const offers = SEED_PRICES.flatMap((price) =>
    SEED_STORES.map((storeId, index) => ({
      storeId,
      itemKey: price.itemKey,
      productName: price.name,
      priceCents: price.sale?.store === storeId ? price.sale.cents : price.prices[index],
      packageQty: price.packageQty,
      packageUnit: price.packageUnit,
      loose: price.loose,
    })),
  );
  const missing = costNeeds({
    needs: aggregateNeeds(planNeeds),
    pantry,
    offers,
    servings: 1,
  }).lines.filter((line) => line.missingQty > 0.05 && line.itemKey);

  for (const line of missing) {
    const def = getIngredient(line.itemKey);
    await prisma.groceryItem.create({
      data: {
        userId: user.id,
        name: def?.fr ?? line.name,
        itemKey: line.itemKey,
        quantity: Math.round(line.missingQty * 100) / 100,
        unit: line.unit,
        category: def?.category ?? inferCategory(line.name),
        source: "plan",
      },
    });
  }

  await refreshAlerts(user.id);
  const basket = optimizeBasket({
    items: missing.map((line) => ({
      itemKey: line.itemKey,
      name: line.name,
      quantity: line.missingQty,
      unit: line.unit,
    })),
    offers,
  });
  console.log(
    JSON.stringify({
      grocery: missing.length,
      single: basket.single ? { stores: basket.single.storeIds, total: basket.single.totalCents } : null,
      split: basket.split ? { stores: basket.split.storeIds, total: basket.split.totalCents } : null,
    }),
  );
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD, userId: user.id };
}
