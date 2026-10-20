import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";
import { getIngredient } from "@/lib/ingredients/dictionary";
import { scaleQuantity } from "@/lib/pricing/cost";
import { addMissingToGrocery } from "@/lib/queries";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const body = await readBody<{ servings?: number }>(request);
  const recipe = await prisma.recipe.findFirst({ where: { id, userId: user.id }, include: { ingredients: true } });
  if (!recipe) return Response.json({ error: "missing" }, { status: 404 });
  const servings = body.servings && body.servings > 0 ? body.servings : recipe.servings;
  const added = await addMissingToGrocery(
    user.id,
    recipe.ingredients.map((ingredient) => ({
      itemKey: ingredient.itemKey,
      name: getIngredient(ingredient.itemKey)?.fr ?? ingredient.item,
      quantity: scaleQuantity(ingredient.quantity, recipe.servings, servings),
      unit: ingredient.unit,
      optional: ingredient.optional,
    })),
    "recipe",
    recipe.id,
  );
  return Response.json({ added });
}
