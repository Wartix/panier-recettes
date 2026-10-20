"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import type { loadPantry } from "@/lib/queries";

export function PantryScreen({ items }: { items: Awaited<ReturnType<typeof loadPantry>> }) {
  const { m } = useI18n();
  const router = useRouter();
  const [line, setLine] = useState("");
  const [location, setLocation] = useState("pantry");
  const groups = ["fridge", "freezer", "pantry"] as const;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!line.trim()) return;
    await sendJson("/api/pantry", "POST", { line, location });
    setLine("");
    router.refresh();
  }

  async function remove(id: string) {
    await sendJson(`/api/pantry/${id}`, "DELETE");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl">{m.pantry.title}</h1>
        <Link href="/receipts" className="text-sm font-semibold text-pine">
          {m.pantry.receipt}
        </Link>
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={line}
          onChange={(event) => setLine(event.target.value)}
          placeholder={m.pantry.line}
          aria-label={m.pantry.line}
          className="min-w-0 flex-1 rounded-2xl border border-line px-3 py-3"
        />
        <select value={location} onChange={(event) => setLocation(event.target.value)} aria-label={m.pantry.title} className="rounded-2xl border border-line bg-cream px-2">
          {groups.map((id) => (
            <option key={id} value={id}>
              {m.locations[id]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-2xl bg-pine px-3 text-sm font-semibold text-cream">
          {m.pantry.add}
        </button>
      </form>
      {groups.map((id) => {
        const rows = items.filter((item) => item.location === id);
        return (
          <section key={id}>
            <h2 className="font-serif text-2xl">{m.locations[id]}</h2>
            {rows.length === 0 ? (
              <p className="mt-1 text-sm text-muted">{m.pantry.empty}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {rows.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-2xl border border-line px-3 py-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted">
                        {item.quantity} {item.unit}
                        {item.urgency !== "none" && item.urgency !== "ok" ? (
                          <span className="ml-2 text-tomato">{m.expiry[item.urgency]}</span>
                        ) : null}
                      </p>
                    </div>
                    <button type="button" onClick={() => remove(item.id)} className="text-xs text-muted" aria-label={item.name}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
