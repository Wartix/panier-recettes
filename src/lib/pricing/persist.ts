import { prisma } from "@/lib/db";
import { matchProductName } from "@/lib/ingredients/match";
import type { ParsedStoreProduct } from "@/lib/pricing/adapters/metro";
import type { ScrapeReport } from "@/lib/pricing/scrape";
import { saleDecision } from "@/lib/pricing/alerts";

export async function saveScrapedProducts(report: ScrapeReport, postalCode: string) {
  if (!report.products.length) return 0;
  let written = 0;
  for (const product of report.products) {
    written += await saveObservation({
      storeId: report.storeId,
      product,
      postalCode,
      source: "scrape",
    });
  }
  return written;
}

export async function saveObservation(input: {
  storeId: string;
  product: ParsedStoreProduct;
  postalCode: string;
  source: string;
  itemKey?: string;
  packageQty?: number | null;
  packageUnit?: string;
  loose?: boolean;
  observedAt?: Date;
}) {
  const itemKey = input.itemKey ?? matchProductName(input.product.name)?.itemKey ?? "";
  const product = await prisma.catalogProduct.upsert({
    where: { storeId_externalId: { storeId: input.storeId, externalId: input.product.externalId } },
    create: {
      storeId: input.storeId,
      externalId: input.product.externalId,
      name: input.product.name,
      brand: input.product.brand,
      itemKey,
      sizeText: input.product.unitPriceText,
      packageQty: input.packageQty ?? null,
      packageUnit: input.packageUnit ?? "",
      loose: Boolean(input.loose),
      productUrl: input.product.productUrl,
    },
    update: {
      name: input.product.name,
      brand: input.product.brand,
      itemKey: itemKey || undefined,
      sizeText: input.product.unitPriceText,
      productUrl: input.product.productUrl,
      ...(input.packageQty != null ? { packageQty: input.packageQty, packageUnit: input.packageUnit ?? "", loose: Boolean(input.loose) } : {}),
    },
  });
  const observedAt = input.observedAt ?? new Date();
  const day = observedAt.toISOString().slice(0, 10);
  const existing = await prisma.priceObservation.findFirst({
    where: { productId: product.id, source: input.source },
    orderBy: { observedAt: "desc" },
  });
  if (existing && existing.observedAt.toISOString().slice(0, 10) === day && existing.priceCents === input.product.priceCents) {
    return 0;
  }
  await prisma.priceObservation.create({
    data: {
      productId: product.id,
      storeId: input.storeId,
      postalCode: input.postalCode.replace(/\s+/g, "").toUpperCase(),
      observedAt,
      priceCents: input.product.priceCents,
      regularPriceCents: input.product.regularPriceCents,
      onSale: input.product.onSale,
      source: input.source,
      unitPriceBasis: input.product.unitPriceText,
    },
  });
  return 1;
}

export async function refreshAlerts(userId: string) {
  const [recipes, pantry, grocery] = await Promise.all([
    prisma.recipeIngredient.findMany({ where: { recipe: { userId } }, select: { itemKey: true } }),
    prisma.pantryItem.findMany({ where: { userId }, select: { itemKey: true } }),
    prisma.groceryItem.findMany({ where: { userId }, select: { itemKey: true } }),
  ]);
  const keys = [...new Set([...recipes, ...pantry, ...grocery].map((row) => row.itemKey).filter(Boolean))];
  await prisma.saleAlert.deleteMany({ where: { userId, read: false } });
  for (const itemKey of keys) {
    const products = await prisma.catalogProduct.findMany({
      where: { itemKey, storeId: { not: "statcan" } },
      include: { observations: { orderBy: { observedAt: "asc" } } },
    });
    for (const product of products) {
      const decision = saleDecision(product.observations.map((point) => ({ priceCents: point.priceCents, onSale: point.onSale })));
      if (!decision.alert) continue;
      await prisma.saleAlert.create({
        data: {
          userId,
          itemKey,
          productName: product.name,
          storeId: product.storeId,
          priceCents: decision.latestCents,
          usualPriceCents: decision.usualCents,
        },
      });
    }
  }
}

export async function saveAdapterReport(reports: ScrapeReport[]) {
  await prisma.scrapeCache.upsert({
    where: { key: "adapter-status" },
    create: {
      key: "adapter-status",
      payload: JSON.stringify({ at: new Date().toISOString(), reports: reports.map(({ products, ...rest }) => ({ ...rest, count: products.length })) }),
    },
    update: {
      fetchedAt: new Date(),
      payload: JSON.stringify({ at: new Date().toISOString(), reports: reports.map(({ products, ...rest }) => ({ ...rest, count: products.length })) }),
    },
  });
}
