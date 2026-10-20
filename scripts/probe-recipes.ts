import { importRecipeFromUrl } from "../src/lib/recipes/import-recipe";

const urls = process.argv.slice(2).filter((arg) => arg.startsWith("http"));
const samples = urls.length
  ? urls
  : [
      "https://www.marmiton.org/recettes/recette_ratatouille_23223.aspx",
      "https://www.bbcgoodfood.com/recipes/next-level-spaghetti-bolognese",
      "https://www.vegrecipesofindia.com/chana-masala/",
      "https://www.justonecookbook.com/miso-soup/",
      "https://www.ricardocuisine.com/recettes/5412-pates-aux-crevettes-et-aux-petits-pois",
    ];

async function main() {
  for (const url of samples) {
    try {
      const recipe = await importRecipeFromUrl(url);
      console.log(
        `ok\t${recipe.language}\t${recipe.cuisine || "-"}\t${recipe.origin || "-"}\t${recipe.ingredientLines.length} ing\t${recipe.title}\t${url}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "error";
      console.log(`fail\t${message}\t${url}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
