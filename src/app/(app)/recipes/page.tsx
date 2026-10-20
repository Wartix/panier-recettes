import { RecipesScreen } from "@/components/recipes-screen";
import { loadRecipes } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function RecipesPage() {
  const user = await requireUser();
  const recipes = await loadRecipes(user.id);
  return <RecipesScreen recipes={recipes} />;
}
