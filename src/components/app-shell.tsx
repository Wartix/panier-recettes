"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeDollarSign, House, Refrigerator, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { LocaleToggle, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppShell({ postalCode, children }: { postalCode: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { m } = useI18n();
  const links = [
    { href: "/", label: m.nav.home, icon: House },
    { href: "/recipes", label: m.nav.recipes, icon: UtensilsCrossed },
    { href: "/pantry", label: m.nav.pantry, icon: Refrigerator },
    { href: "/grocery", label: m.nav.grocery, icon: ShoppingCart },
    { href: "/prices", label: m.nav.prices, icon: BadgeDollarSign },
  ];
  return (
    <div className="min-h-dvh">
      <aside className="pointer-events-none fixed inset-y-0 left-0 hidden w-[calc(50%-16.5rem)] items-end justify-end px-10 pb-24 xl:flex">
        <div className="pointer-events-auto max-w-xs">
          <p className="text-xs font-semibold tracking-[0.18em] text-pine uppercase">{m.sideKicker}</p>
          <h2 className="mt-3 font-serif text-5xl leading-[0.95] font-medium">{m.sideTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{m.sideBody}</p>
        </div>
      </aside>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-cream shadow-[0_0_0_1px_rgba(36,28,22,0.04)] md:my-4 md:min-h-[calc(100dvh-2rem)] md:rounded-[28px] md:border md:border-line">
        <header className="flex items-center justify-between px-4 pt-4">
          <Link href="/" className="font-serif text-xl">
            Panier Recettes
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/account" className="rounded-full bg-paper px-2 py-1 text-[11px] font-medium text-muted">
              {postalCode}
            </Link>
            <LocaleToggle />
          </div>
        </header>
        <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
        <nav aria-label="Primary" className="sticky bottom-0 z-20 border-t border-line bg-cream/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
          <ul className="grid grid-cols-5">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium",
                      active ? "text-pine" : "text-muted",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
