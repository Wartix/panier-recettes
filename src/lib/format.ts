export function formatMoney(cents: number, locale: "fr" | "en" = "fr"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.round(value * 1000) / 1000;
}

export function torontoDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function weekStartISO(date = new Date()): string {
  const [year, month, day] = torontoDate(date).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = utc.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export type ExpiryUrgency = "none" | "ok" | "soon" | "today" | "expired";

export function expiryUrgency(date: Date | null | undefined, now = new Date()): ExpiryUrgency {
  if (!date) return "none";
  const today = torontoDate(now);
  const target = torontoDate(date);
  if (target < today) return "expired";
  if (target === today) return "today";
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = target.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  const diff = Math.round((b - a) / 86400000);
  if (diff <= 3) return "soon";
  return "ok";
}
