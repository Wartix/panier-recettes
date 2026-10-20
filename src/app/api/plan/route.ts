import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";
import { weekStartISO } from "@/lib/format";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<{ recipeId?: string; dayIndex?: number; meal?: string }>(request);
  const recipe = await prisma.recipe.findFirst({ where: { id: body.recipeId, userId: user.id } });
  if (!recipe) return Response.json({ error: "missing" }, { status: 404 });
  const entry = await prisma.mealEntry.create({
    data: {
      userId: user.id,
      recipeId: recipe.id,
      weekStart: weekStartISO(),
      dayIndex: Math.min(6, Math.max(0, body.dayIndex ?? 0)),
      meal: body.meal || "dinner",
      servings: recipe.servings,
    },
  });
  return Response.json({ id: entry.id });
}
