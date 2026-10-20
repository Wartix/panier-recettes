"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import type { loadPrices } from "@/lib/queries";

const COLORS = ["#1c4536", "#c4492c", "#8a5a12", "#2c4c7c", "#6b3f69", "#3f6212", "#44403c"];

export function PricesScreen({ data }: { data: Awaited<ReturnType<typeof loadPrices>> }) {
  const { m, locale } = useI18n();
  const router = useRouter();
  const keys = [...new Set(data.series.map((series) => series.itemKey))];
  const [itemKey, setItemKey] = useState(data.alerts[0]?.itemKey || keys[0] || "butter");
  const [busy, setBusy] = useState(false);
  const selected = data.series.filter((series) => series.itemKey === itemKey);
  const name = selected[0] ? (locale === "en" ? selected[0].nameEn : selected[0].name) : itemKey;

  const chart = useMemo(() => buildChart(selected), [selected]);

  async function refresh() {
    setBusy(true);
    try {
      await sendJson("/api/prices/refresh", "POST");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-4xl">{m.prices.title}</h1>
      <section>
        <h2 className="font-serif text-2xl">{m.prices.alerts}</h2>
        {data.alerts.length === 0 ? (
          <p className="mt-1 text-sm text-muted">{m.prices.none}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.alerts.map((alert) => (
              <li key={alert.id}>
                <button type="button" onClick={() => setItemKey(alert.itemKey)} className="w-full rounded-2xl bg-[#f8ebe3] px-3 py-3 text-left">
                  <p className="font-medium">
                    {alert.productName} · {alert.store}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-tomato">{formatMoney(alert.priceCents, locale)}</span>
                    <span className="text-muted">
                      {" "}
                      · {m.prices.usual} {formatMoney(alert.usualPriceCents, locale)}
                    </span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">{m.prices.history}</h2>
          <select value={itemKey} onChange={(event) => setItemKey(event.target.value)} aria-label={m.prices.history} className="rounded-full border border-line bg-cream px-2 py-1 text-sm">
            {keys.map((key) => {
              const series = data.series.find((item) => item.itemKey === key);
              return (
                <option key={key} value={key}>
                  {series ? (locale === "en" ? series.nameEn : series.name) : key}
                </option>
              );
            })}
          </select>
        </div>
        <p className="mt-1 text-sm text-muted">{name}</p>
        <svg viewBox="0 0 320 140" className="mt-3 h-36 w-full" role="img" aria-label={name}>
          {chart.lines.map((line) => (
            <polyline key={line.storeId} fill="none" stroke={line.color} strokeWidth="2.5" points={line.points} />
          ))}
        </svg>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {selected.map((series, index) => {
            const latest = series.points.at(-1);
            return (
              <li key={`${series.storeId}-${series.productName}`} className="flex justify-between">
                <span style={{ color: COLORS[index % COLORS.length] }}>{series.store}</span>
                <span>
                  {latest ? formatMoney(latest.priceCents, locale) : "—"}
                  {latest?.onSale ? ` · ${m.prices.sale}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{m.prices.adapters}</h2>
          <button type="button" onClick={refresh} disabled={busy} className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
            {busy ? m.prices.refreshing : m.prices.refresh}
          </button>
        </div>
        {data.adapters.length === 0 ? (
          <p className="text-sm text-muted">{m.prices.notProbed}</p>
        ) : (
          <ul className="space-y-2">
            {data.adapters.map((adapter) => (
              <li key={adapter.storeId} className="rounded-2xl border border-line px-3 py-3">
                <p className="font-medium">
                  {adapter.displayName}
                  <span className="ml-2 text-xs font-semibold text-pine uppercase">{adapter.state}</span>
                </p>
                <p className="text-xs leading-relaxed text-muted">{adapter.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function buildChart(series: Awaited<ReturnType<typeof loadPrices>>["series"]) {
  const values = series.flatMap((item) => item.points.map((point) => point.priceCents));
  if (!values.length) return { lines: [] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return {
    lines: series.map((item, index) => {
      const step = item.points.length > 1 ? 300 / (item.points.length - 1) : 0;
      const points = item.points
        .map((point, pointIndex) => {
          const x = 10 + pointIndex * step;
          const y = 120 - ((point.priceCents - min) / span) * 100;
          return `${x},${y}`;
        })
        .join(" ");
      return { storeId: item.storeId + item.productName, color: COLORS[index % COLORS.length], points };
    }),
  };
}
