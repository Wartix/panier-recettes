"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

const SAMPLE = `MAXI
LAVAL CHOMEDEY
LAIT 2% 2L                 5,29
BEURRE SALE 454G           4,99
OEUFS GROS X12             4,49
POITRINE POULET
  0,682 kg @ 13,99/kg      9,54
SOUS-TOTAL                24,31
TOTAL                     24,31`;

type Line = { name: string; quantity: number; unit: string; priceCents: number; itemKey: string; category: string };
type Parsed = { storeName: string; storeId: string; lines: Line[]; totalCents: number | null };

export function ReceiptScreen() {
  const { m, locale } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [note, setNote] = useState("");

  async function read(event: React.FormEvent) {
    event.preventDefault();
    const data = (await sendJson("/api/receipts", "POST", { text, commit: false })) as Parsed;
    setParsed(data);
    setNote(data.lines.length ? "" : m.receipt.empty);
  }

  async function save() {
    if (!parsed) return;
    await sendJson("/api/receipts", "POST", { text, commit: true });
    setNote(m.receipt.saved);
    router.push("/pantry");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">{m.receipt.title}</h1>
      <p className="text-sm text-muted">{m.receipt.lead}</p>
      <button type="button" onClick={() => setText(SAMPLE)} className="text-sm font-semibold text-pine">
        {m.receipt.sample}
      </button>
      <form onSubmit={read} className="space-y-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
          rows={10}
          aria-label={m.receipt.title}
          className="w-full rounded-2xl border border-line px-3 py-3 text-sm"
        />
        <button type="submit" className="w-full rounded-full bg-pine py-3 text-sm font-semibold text-cream">
          {m.receipt.parse}
        </button>
      </form>
      {note ? <p className="text-sm text-pine">{note}</p> : null}
      {parsed && parsed.lines.length > 0 ? (
        <section className="rounded-3xl border border-line p-4">
          <p className="text-xs font-semibold text-muted">{parsed.storeName}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {parsed.lines.map((line) => (
              <li key={`${line.name}-${line.priceCents}`} className="flex justify-between gap-3">
                <span>
                  {line.name}
                  <span className="text-muted">
                    {" "}
                    · {line.quantity} {line.unit}
                  </span>
                </span>
                <span>{formatMoney(line.priceCents, locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            {m.receipt.total} {parsed.totalCents != null ? formatMoney(parsed.totalCents, locale) : ""}
          </p>
          <button type="button" onClick={save} className="mt-3 w-full rounded-full bg-ink py-3 text-sm font-semibold text-cream">
            {m.receipt.save}
          </button>
        </section>
      ) : null}
    </div>
  );
}
