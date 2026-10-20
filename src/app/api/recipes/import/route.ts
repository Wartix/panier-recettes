import { requireApiUser, readBody } from "@/lib/api";
import { importRecipeFromUrl } from "@/lib/recipes/import-recipe";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<{ url?: string }>(request);
  try {
    const recipe = await importRecipeFromUrl(body.url ?? "");
    return Response.json(recipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "import_failed";
    return Response.json({ error: message }, { status: 422 });
  }
}
