"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/fr";

type Locale = "fr" | "en";

const Ctx = createContext<{ locale: Locale; m: Messages } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ locale, m: messages }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const value = useContext(Ctx);
  if (!value) throw new Error("i18n");
  return value;
}

export function LocaleToggle() {
  const { locale } = useI18n();
  const router = useRouter();
  function setLocale(next: Locale) {
    document.cookie = `pr_locale=${next}; path=/; max-age=31536000`;
    router.refresh();
  }
  return (
    <div className="flex rounded-full border border-line bg-cream p-0.5 text-xs font-semibold">
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={code === locale ? "rounded-full bg-pine px-2 py-1 text-cream" : "px-2 py-1 text-muted"}
          aria-pressed={code === locale}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
