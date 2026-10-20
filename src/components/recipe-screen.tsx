"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { costNeeds, scaleQuantity } from "@/lib/pricing/cost";
import { formatMoney } from "@/lib/format";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import type { loadRecipe } from "@/lib/queries";

type RecipeData = NonNullable<Awaited<ReturnType<typeof loadRecipe>>>;

export function RecipeScreen({ data }: { data: RecipeData }) {
  const { m, locale } = useI18n();
  const router = useRouter();
  const [servings, setServings] = useState(data.servings);
  const [note, setNote] = useState("");
  const title = locale === "en" ? data.titleEn || data.title : data.title || data.titleEn;
  const description = locale === "en" ? data.descriptionEn || data.description : data.description || data.descriptionEn;
  const steps = locale === "en" ? (data.stepsEn.length ? data.stepsEn : data.steps) : data.steps.length ? data.steps : data.stepsEn;

  const cost = useMemo(() => {
    return costNeeds({
      servings,
      pantry: data.pantry,
      offers: data.offers,
      needs: data.ingredients.map((ingredient) => ({
        itemKey: ingredient.itemKey,
        name: locale === "en" ? ingredient.displayEn : ingredient.displayFr,
        quantity: scaleQuantity(ingredient.quantity, data.servings, servings),
        unit: ingredient.unit,
        optional: ingredient.optional,
      })),
    });
  }, [data, locale, servings]);

  async function addMissing() {
    await sendJson(`/api/recipes/${data.id}/grocery`, "POST", { servings });
    setNote(m.recipe.added);
    router.refresh();
  }

  return (
    <article className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold tracking-wide text-tomato uppercase">
          {data.cuisine}
          {data.origin ? ` · ${data.origin}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-4xl leading-[0.95]">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <p className="mt-1 text-xs text-muted">
          {data.prepMinutes + data.cookMinutes} min
          {data.sourceUrl ? (
            <>
              {" · "}
              <a className="underline" href={data.sourceUrl}>
                {m.recipe.source}
              </a>
            </>
          ) : null}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-pine p-4 text-cream">
          <p className="text-[11px] uppercase opacity-80">{m.recipe.buy}</p>
          <p className="mt-1 font-serif text-3xl">{formatMoney(cost.buyCostCents, locale)}</p>
          <p className="text-xs opacity-80">
            {formatMoney(cost.perServingBuyCents, locale)} {m.recipe.each}
          </p>
        </div>
        <div className="rounded-3xl border border-line p-4">
          <p className="text-[11px] text-muted uppercase">{m.recipe.full}</p>
          <p className="mt-1 font-serif text-3xl">{formatMoney(cost.fullCostCents, locale)}</p>
          <p className="text-xs text-muted">
            {formatMoney(cost.perServingFullCents, locale)} {m.recipe.each}
          </p>
        </div>
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2">
        <span className="text-sm font-medium">{m.recipe.servings}</span>
        <span className="flex items-center gap-3">
          <button type="button" className="size-8 rounded-full border border-line" onClick={() => setServings((value) => Math.max(1, value - 1))} aria-label="-">
            −
          </button>
          <span className="w-6 text-center font-serif text-xl">{servings}</span>
          <button type="button" className="size-8 rounded-full border border-line" onClick={() => setServings((value) => value + 1)} aria-label="+">
            +
          </button>
        </span>
      </label>

      <ul className="space-y-2">
        {cost.lines.map((line, index) => {
          const ingredient = data.ingredients[index];
          const label = locale === "en" ? ingredient.displayEn : ingredient.displayFr;
          const state = line.optional ? m.recipe.optional : line.missingQty > 0.05 ? m.recipe.need : m.recipe.have;
          return (
            <li key={ingredient.id} className="flex items-start justify-between gap-3 border-b border-line py-2">
              <div>
                <p className={line.missingQty > 0.05 && !line.optional ? "font-medium" : "text-muted"}>
                  {ingredient.quantity != null ? `${scaleQuantity(ingredient.quantity, data.servings, servings)} ${ingredient.unit} ` : ""}
                  {label}
                </p>
                <p className="text-xs text-muted">
                  {state}
                  {line.estimate ? ` · ${m.recipe.estimate}` : ""}
                  {!line.priced && !line.optional ? ` · ${m.recipe.unpriced}` : ""}
                </p>
              </div>
              <p className="text-sm">{line.buyCostCents ? formatMoney(line.buyCostCents, locale) : ""}</p>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={addMissing} className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-cream">
        {m.recipe.add}
      </button>
      {note ? <p className="text-center text-sm text-pine">{note}</p> : null}

      <section>
        <h2 className="font-serif text-2xl">{m.recipe.steps}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
