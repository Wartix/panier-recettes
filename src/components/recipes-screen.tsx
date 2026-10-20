"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { loadRecipes } from "@/lib/queries";

export function RecipesScreen({ recipes }: { recipes: Awaited<ReturnType<typeof loadRecipes>> }) {
  const { m, locale } = useI18n();
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="font-serif text-4xl">{m.recipes.title}</h1>
        <Link href="/recipes/import" className="rounded-full bg-pine px-3 py-2 text-sm font-semibold text-cream">
          {m.recipes.import}
        </Link>
      </div>
      {recipes.length === 0 ? (
        <p className="text-sm text-muted">{m.recipes.empty}</p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.id}`} className="block rounded-3xl border border-line px-4 py-4">
                <p className="text-[11px] font-semibold tracking-wide text-tomato uppercase">
                  {recipe.cuisine}
                  {recipe.origin ? ` · ${recipe.origin}` : ""}
                </p>
                <h2 className="mt-1 font-serif text-2xl leading-tight">{locale === "en" && recipe.titleEn ? recipe.titleEn : recipe.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  {recipe.minutes} {m.recipes.minutes} · {recipe.servings}
                </p>
                <p className="mt-3 font-serif text-3xl text-pine">{formatMoney(recipe.perServingBuyCents, locale)}</p>
                <p className="text-xs text-muted">
                  {m.recipes.per}
                  {recipe.missing > 0 ? ` · ${recipe.missing} ${m.recipes.missing}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
