import { notFound } from "next/navigation";
import { RecipeScreen } from "@/components/recipe-screen";
import { loadRecipe } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const recipe = await loadRecipe(user.id, id);
  if (!recipe) notFound();
  return <RecipeScreen data={recipe} />;
}
