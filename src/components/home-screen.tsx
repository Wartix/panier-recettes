"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { loadHome } from "@/lib/queries";

type HomeData = Awaited<ReturnType<typeof loadHome>>;

export function HomeScreen({ data }: { data: HomeData }) {
  const { m, locale } = useI18n();
  const savings =
    data.single && data.split && data.split.totalCents < data.single.totalCents
      ? data.single.totalCents - data.split.totalCents
      : 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl leading-none font-medium">
          {m.home.hello}, {data.name}.
        </h1>
        <p className="mt-2 text-sm text-muted">
          {data.groceryCount} {m.home.toBuy}
          {savings > 0 ? ` · ${formatMoney(savings, locale)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/grocery" className="rounded-3xl bg-pine p-4 text-cream">
          <p className="text-[11px] tracking-wide uppercase opacity-80">{m.home.single}</p>
          <p className="mt-2 font-serif text-3xl">{data.single ? formatMoney(data.single.totalCents, locale) : "—"}</p>
          <p className="mt-1 text-xs opacity-80">{data.single?.stores.join(" · ") || m.home.openGrocery}</p>
        </Link>
        <Link href="/grocery" className="rounded-3xl border border-line bg-paper p-4">
          <p className="text-[11px] tracking-wide text-muted uppercase">{m.home.split}</p>
          <p className="mt-2 font-serif text-3xl">{data.split ? formatMoney(data.split.totalCents, locale) : "—"}</p>
          <p className="mt-1 text-xs text-muted">{data.split?.stores.join(" + ") || "—"}</p>
        </Link>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{m.home.week}</h2>
          <Link href="/plan" className="text-sm font-semibold text-pine">
            {m.home.plan}
          </Link>
        </div>
        {data.meals.length === 0 ? (
          <p className="text-sm text-muted">{m.home.emptyMeals}</p>
        ) : (
          <ul className="space-y-2">
            {data.meals.map((meal) => (
              <li key={meal.id}>
                <Link href={`/recipes/${meal.recipeId}`} className="flex items-baseline justify-between rounded-2xl border border-line px-3 py-3">
                  <span>
                    <span className="mr-2 text-xs font-semibold text-tomato">{m.days[meal.dayIndex]}</span>
                    <span className="font-medium">{locale === "en" && meal.titleEn ? meal.titleEn : meal.title}</span>
                  </span>
                  <span className="text-xs text-muted">{meal.cuisine}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.alerts.length > 0 && (
        <section>
          <h2 className="mb-2 font-serif text-2xl">{m.home.alerts}</h2>
          <ul className="space-y-2">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="rounded-2xl bg-[#f8ebe3] px-3 py-3">
                <p className="font-medium">{alert.productName}</p>
                <p className="text-sm text-muted">
                  {alert.store} · {formatMoney(alert.priceCents, locale)}
                  <span className="text-tomato"> · {m.home.usual} {formatMoney(alert.usualPriceCents, locale)}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.expiring.length > 0 && (
        <section>
          <h2 className="mb-2 font-serif text-2xl">{m.home.expiring}</h2>
          <ul className="flex flex-wrap gap-2">
            {data.expiring.map((item) => (
              <li key={item.id} className="rounded-full bg-paper px-3 py-1 text-sm">
                {item.name}
                <span className="ml-2 text-xs text-tomato">{m.expiry[item.urgency]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/recipes/import" className="block rounded-full bg-ink py-3 text-center text-sm font-semibold text-cream">
        {m.home.import}
      </Link>
    </div>
  );
}
