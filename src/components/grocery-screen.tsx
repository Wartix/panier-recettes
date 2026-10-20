"use client";

import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { storeName } from "@/lib/stores";
import type { loadGrocery } from "@/lib/queries";

type GroceryData = Awaited<ReturnType<typeof loadGrocery>>;

export function GroceryScreen({ data }: { data: GroceryData }) {
  const { m, locale } = useI18n();
  const router = useRouter();
  const open = data.items.filter((item) => !item.checked);
  const done = data.items.filter((item) => item.checked);
  const savings = data.single && data.split ? data.single.totalCents - data.split.totalCents : 0;

  async function toggle(id: string, checked: boolean) {
    await sendJson(`/api/grocery/${id}`, "PATCH", { checked });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-4xl">{m.grocery.title}</h1>
      <div className="space-y-3">
        <PlanCard
          kicker={m.grocery.single}
          plan={data.single}
          locale={locale}
          estimateLabel={m.grocery.estimate}
          missingLabel={m.grocery.missing}
        />
        <PlanCard
          kicker={m.grocery.split}
          plan={data.split}
          locale={locale}
          estimateLabel={m.grocery.estimate}
          missingLabel={m.grocery.missing}
          note={savings > 0 ? `${formatMoney(savings, locale)} ${m.grocery.savings}` : data.split ? m.grocery.noSplit : ""}
        />
      </div>
      {open.length === 0 ? (
        <p className="text-sm text-muted">{m.grocery.empty}</p>
      ) : (
        <ul className="space-y-2">
          {open.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-3">
              <input type="checkbox" checked={false} onChange={() => toggle(item.id, true)} aria-label={item.name} className="size-4" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.quantity} {item.unit} · {m.categories[item.category as keyof typeof m.categories] ?? item.category}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">{m.grocery.checked}</h2>
          <ul className="space-y-1">
            {done.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => toggle(item.id, false)} className="text-sm text-muted line-through">
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PlanCard({
  kicker,
  plan,
  locale,
  note,
  estimateLabel,
  missingLabel,
}: {
  kicker: string;
  plan: GroceryData["single"];
  locale: "fr" | "en";
  note?: string;
  estimateLabel: string;
  missingLabel: string;
}) {
  if (!plan) return null;
  return (
    <section className="rounded-3xl border border-line p-4">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{kicker}</p>
      <p className="mt-1 font-serif text-3xl">{formatMoney(plan.totalCents, locale)}</p>
      <p className="text-sm text-pine">{plan.storeIds.map(storeName).join(" + ") || "StatCan"}</p>
      {note ? <p className="mt-1 text-xs text-tomato">{note}</p> : null}
      {plan.estimateCents > 0 ? (
        <p className="mt-1 text-xs text-muted">
          {formatMoney(plan.estimateCents, locale)} {estimateLabel}
        </p>
      ) : null}
      {plan.missing.length > 0 ? (
        <p className="mt-1 text-xs text-muted">
          {missingLabel}: {plan.missing.join(", ")}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {plan.picks.map((pick) => (
          <li key={pick.storeId}>
            <p className="text-xs font-semibold">{storeName(pick.storeId)}</p>
            <p className="text-xs text-muted">
              {pick.items.map((item) => item.name).join(", ")} · {formatMoney(pick.subtotalCents, locale)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
