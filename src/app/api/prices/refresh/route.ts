import { requireApiUser } from "@/lib/api";
import { refreshAlerts, saveAdapterReport, saveScrapedProducts } from "@/lib/pricing/persist";
import { runAllAdapters } from "@/lib/pricing/scrape";

export const maxDuration = 120;

export async function POST() {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const reports = await runAllAdapters();
  let written = 0;
  for (const report of reports) {
    if (report.state === "ok") written += await saveScrapedProducts(report, user.postalCode);
  }
  await saveAdapterReport(reports);
  await refreshAlerts(user.id);
  return Response.json({
    written,
    reports: reports.map(({ products, ...report }) => ({ ...report, count: products.length })),
  });
}
