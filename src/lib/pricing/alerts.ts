export type PricePoint = {
  priceCents: number;
  onSale?: boolean;
};

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function saleDecision(history: PricePoint[], threshold = 0.9): {
  alert: boolean;
  usualCents: number;
  latestCents: number;
  drop: number;
} {
  if (!history.length) {
    return { alert: false, usualCents: 0, latestCents: 0, drop: 0 };
  }
  const latest = history[history.length - 1].priceCents;
  if (history.length < 2) {
    return { alert: false, usualCents: latest, latestCents: latest, drop: 0 };
  }
  const usual = median(history.slice(0, -1).map((point) => point.priceCents));
  const drop = usual <= 0 ? 0 : (usual - latest) / usual;
  return {
    alert: latest <= usual * threshold && drop > 0.0001,
    usualCents: Math.round(usual),
    latestCents: latest,
    drop,
  };
}
