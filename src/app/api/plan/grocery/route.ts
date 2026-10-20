import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api";
import { weekStartISO } from "@/lib/format";
import { getIngredient } from "@/lib/ingredients/dictionary";
import { scaleQuantity } from "@/lib/pricing/cost";
import { addMissingToGrocery } from "@/lib/queries";

export async function POST() {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const meals = await prisma.mealEntry.findMany({
    where: { userId: user.id, weekStart: weekStartISO() },
    include: { recipe: { include: { ingredients: true } } },
  });
  const needs = meals.flatMap((meal) =>
    meal.recipe.ingredients.map((ingredient) => ({
      itemKey: ingredient.itemKey,
      name: getIngredient(ingredient.itemKey)?.fr ?? ingredient.item,
      quantity: scaleQuantity(ingredient.quantity, meal.recipe.servings, meal.servings),
      unit: ingredient.unit,
      optional: ingredient.optional,
    })),
  );
  const added = await addMissingToGrocery(user.id, needs, "plan");
  return Response.json({ added });
}
