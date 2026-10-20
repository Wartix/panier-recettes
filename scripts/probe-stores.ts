import { prisma } from "../src/lib/db";
import { saveAdapterReport, saveScrapedProducts } from "../src/lib/pricing/persist";
import { runAllAdapters } from "../src/lib/pricing/scrape";

async function main() {
  const save = process.argv.includes("--save");
  const reports = await runAllAdapters();
  for (const report of reports) {
    console.log(`${report.storeId}\t${report.state}\t${report.products.length}\t${report.detail}`);
  }

  if (save) {
    const postal = (process.env.DEFAULT_POSTAL_CODE || "H7T2P1").replace(/\s+/g, "");
    let written = 0;
    for (const report of reports) {
      if (report.state !== "ok") continue;
      written += await saveScrapedProducts(report, postal);
    }
    await saveAdapterReport(reports);
    console.log(`saved observations: ${written}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
