import { prisma } from "@/lib/db";
import { inferCategory } from "@/lib/categories";
import { readBody, requireApiUser } from "@/lib/api";
import { parseIngredientLine } from "@/lib/ingredients/parse";
import { getIngredient } from "@/lib/ingredients/dictionary";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<{ line?: string; location?: string }>(request);
  const parsed = parseIngredientLine(body.line ?? "");
  const itemKey = parsed.itemKey;
  const def = itemKey ? getIngredient(itemKey) : undefined;
  const item = await prisma.pantryItem.create({
    data: {
      userId: user.id,
      name: def?.fr ?? parsed.item,
      itemKey,
      quantity: parsed.quantity ?? 1,
      unit: parsed.unit || "ct",
      category: def?.category ?? inferCategory(parsed.item),
      location: body.location === "fridge" || body.location === "freezer" ? body.location : "pantry",
      purchaseDate: new Date(),
    },
  });
  return Response.json({ id: item.id });
}
