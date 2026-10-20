import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";
import { parseIngredientLine } from "@/lib/ingredients/parse";
import type { ImportedRecipe } from "@/lib/recipes/jsonld";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<Partial<ImportedRecipe>>(request);
  if (!body.title || !body.ingredientLines?.length) return Response.json({ error: "invalid" }, { status: 400 });
  const french = body.language === "fr";
  const recipe = await prisma.recipe.create({
    data: {
      userId: user.id,
      title: french ? body.title : body.title,
      titleEn: french ? "" : body.title,
      description: body.description ?? "",
      descriptionEn: french ? "" : (body.description ?? ""),
      cuisine: body.cuisine ?? "",
      origin: body.origin ?? "",
      language: body.language ?? "fr",
      sourceUrl: body.sourceUrl ?? "",
      imageUrl: body.imageUrl ?? "",
      servings: body.servings && body.servings > 0 ? body.servings : 4,
      prepMinutes: body.prepMinutes ?? 0,
      cookMinutes: body.cookMinutes ?? 0,
      steps: JSON.stringify(french ? (body.steps ?? []) : []),
      stepsEn: JSON.stringify(french ? [] : (body.steps ?? [])),
      ingredients: {
        create: body.ingredientLines.map((line, position) => {
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
  });
  return Response.json({ id: recipe.id });
}
