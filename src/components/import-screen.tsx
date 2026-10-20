"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

const EXAMPLES = [
  "https://www.marmiton.org/recettes/recette_ratatouille_23223.aspx",
  "https://www.bbcgoodfood.com/recipes/next-level-spaghetti-bolognese",
  "https://www.vegrecipesofindia.com/chana-masala/",
  "https://www.justonecookbook.com/miso-soup/",
];

type Preview = {
  title: string;
  cuisine: string;
  origin: string;
  servings: number;
  language: string;
  ingredientLines: string[];
  steps: string[];
  sourceUrl: string;
  description: string;
};

export function ImportScreen() {
  const { m } = useI18n();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function readPage(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const data = (await sendJson("/api/recipes/import", "POST", { url })) as Preview & { error?: string };
      setPreview(data);
    } catch {
      setError(m.import.error);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!preview) return;
    setBusy(true);
    try {
      const saved = (await sendJson("/api/recipes", "POST", preview)) as { id: string };
      router.push(`/recipes/${saved.id}`);
      router.refresh();
    } catch {
      setError(m.import.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">{m.import.title}</h1>
      <p className="text-sm leading-relaxed text-muted">{m.import.lead}</p>
      <form onSubmit={readPage} className="space-y-3">
        <label className="block text-sm font-medium">
          {m.import.url}
          <input
            required
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3"
          />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-full bg-pine py-3 text-sm font-semibold text-cream disabled:opacity-60">
          {busy ? m.import.working : m.import.submit}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" onClick={() => setUrl(example)} className="rounded-full bg-paper px-3 py-1 text-left text-xs text-muted">
            {new URL(example).hostname.replace(/^www\./, "")}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-tomato">{error}</p> : null}
      {preview ? (
        <section className="rounded-3xl border border-line p-4">
          <p className="text-[11px] font-semibold tracking-wide text-tomato uppercase">
            {preview.cuisine || preview.language}
            {preview.origin ? ` · ${preview.origin}` : ""}
          </p>
          <h2 className="mt-1 font-serif text-3xl">{preview.title}</h2>
          <p className="mt-1 text-sm text-muted">{preview.servings}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {preview.ingredientLines.slice(0, 8).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" onClick={save} disabled={busy} className="mt-4 w-full rounded-full bg-ink py-3 text-sm font-semibold text-cream">
            {m.import.save}
          </button>
        </section>
      ) : null}
    </div>
  );
}
