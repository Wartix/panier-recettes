"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import type { loadPlan } from "@/lib/queries";

export function PlanScreen({ data }: { data: Awaited<ReturnType<typeof loadPlan>> }) {
  const { m, locale } = useI18n();
  const router = useRouter();
  const [recipeId, setRecipeId] = useState(data.recipes[0]?.id ?? "");
  const [dayIndex, setDayIndex] = useState(0);
  const [note, setNote] = useState("");

  async function add(event: React.FormEvent) {
    event.preventDefault();
    await sendJson("/api/plan", "POST", { recipeId, dayIndex, meal: "dinner" });
    router.refresh();
  }

  async function remove(id: string) {
    await sendJson(`/api/plan/${id}`, "DELETE");
    router.refresh();
  }

  async function push() {
    const result = await sendJson("/api/plan/grocery", "POST");
    setNote(`${m.plan.pushed} (${result.added ?? 0})`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-4xl">{m.plan.title}</h1>
      <ul className="space-y-2">
        {m.days.map((day, index) => {
          const meals = data.meals.filter((meal) => meal.dayIndex === index);
          return (
            <li key={day} className="rounded-2xl border border-line px-3 py-3">
              <p className="text-xs font-semibold text-tomato">{day}</p>
              {meals.length === 0 ? (
                <p className="text-sm text-muted">{m.plan.empty}</p>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="mt-1 flex items-center justify-between">
                    <Link href={`/recipes/${meal.recipeId}`} className="font-medium">
                      {locale === "en" && meal.titleEn ? meal.titleEn : meal.title}
                    </Link>
                    <button type="button" onClick={() => remove(meal.id)} className="text-xs text-muted">
                      {m.plan.remove}
                    </button>
                  </div>
                ))
              )}
            </li>
          );
        })}
      </ul>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))} aria-label={m.plan.title} className="rounded-2xl border border-line bg-cream px-2 py-2">
          {m.days.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
        <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)} aria-label={m.plan.add} className="min-w-0 flex-1 rounded-2xl border border-line bg-cream px-2 py-2">
          {data.recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {locale === "en" && recipe.titleEn ? recipe.titleEn : recipe.title}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-2xl bg-pine px-3 text-sm font-semibold text-cream">
          {m.plan.add}
        </button>
      </form>
      <button type="button" onClick={push} className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-cream">
        {m.plan.push}
      </button>
      {note ? <p className="text-center text-sm text-pine">{note}</p> : null}
    </div>
  );
}
