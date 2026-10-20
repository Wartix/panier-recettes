import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";
import { getIngredient } from "@/lib/ingredients/dictionary";
import { saveObservation } from "@/lib/pricing/persist";
import { parseReceipt } from "@/lib/receipts/parse";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<{ text?: string; commit?: boolean }>(request);
  const parsed = parseReceipt(body.text ?? "");
  if (!body.commit) return Response.json(parsed);

  const purchasedAt = new Date();
  const receipt = await prisma.receipt.create({
    data: {
      userId: user.id,
      storeName: parsed.storeName || "Reçu",
      storeId: parsed.storeId,
      purchasedAt,
      rawText: body.text ?? "",
      totalCents: parsed.totalCents ?? 0,
      lines: {
        create: parsed.lines.map((line) => ({
          name: line.name,
          itemKey: line.itemKey,
          quantity: line.quantity,
          unit: line.unit,
          priceCents: line.priceCents,
          category: line.category,
        })),
      },
    },
  });

  for (const line of parsed.lines) {
    const def = line.itemKey ? getIngredient(line.itemKey) : undefined;
    await prisma.pantryItem.create({
      data: {
        userId: user.id,
        name: def?.fr ?? line.name,
        itemKey: line.itemKey,
        quantity: line.quantity,
        unit: line.unit,
        category: line.category,
        location: line.category === "dairy" || line.category === "meat" || line.category === "eggs" ? "fridge" : "pantry",
        purchaseDate: purchasedAt,
        priceCents: line.priceCents,
        storeId: parsed.storeId,
      },
    });
    if (parsed.storeId) {
      await saveObservation({
        storeId: parsed.storeId,
        postalCode: user.postalCode,
        source: "receipt",
        itemKey: line.itemKey,
        packageQty: line.quantity,
        packageUnit: line.unit,
        loose: line.unit === "kg" || line.unit === "g",
        observedAt: purchasedAt,
        product: {
          externalId: `receipt-${receipt.id}-${line.name}`,
          name: line.name,
          brand: "",
          priceCents: line.priceCents,
          regularPriceCents: null,
          onSale: false,
          unitPriceText: "",
          productUrl: "",
        },
      });
    }
  }
  return Response.json({ id: receipt.id, ...parsed });
}
