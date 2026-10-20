import { isStoreEnabled, parseRobots, pathAllowed } from "@/lib/pricing/robots";
import { METRO_LISTING_PATHS, parseMetroListing, type ParsedStoreProduct } from "@/lib/pricing/adapters/metro";
import { fold } from "@/lib/ingredients/dictionary";
import { matchIngredientName } from "@/lib/ingredients/match";

export const STORE_IDS = ["maxi", "provigo", "iga", "metro", "superc", "walmart", "costco"] as const;
export type StoreId = (typeof STORE_IDS)[number];

export type ScrapeState = "ok" | "disabled" | "disallowed" | "blocked" | "empty" | "error";

export type ScrapeReport = {
  storeId: StoreId;
  displayName: string;
  state: ScrapeState;
  detail: string;
  products: ParsedStoreProduct[];
};

const BOT_UA = "PanierRecettesBot/0.1 (+local; rate-limited grocery research; respects robots.txt)";
const lastHit = new Map<string, number>();

type AdapterSpec = {
  id: StoreId;
  displayName: string;
  origin: string;
  paths: string[];
  parse?: (html: string) => ParsedStoreProduct[];
};

export const ADAPTERS: AdapterSpec[] = [
  {
    id: "metro",
    displayName: "Metro",
    origin: "https://www.metro.ca",
    paths: METRO_LISTING_PATHS,
    parse: parseMetroListing,
  },
  {
    id: "maxi",
    displayName: "Maxi",
    origin: "https://www.maxi.ca",
    paths: ["/en/food/dairy-eggs/milk-cream/c/28224"],
  },
  {
    id: "provigo",
    displayName: "Provigo",
    origin: "https://www.provigo.ca",
    paths: ["/en/food/dairy-eggs/milk-cream/c/28224"],
  },
  {
    id: "iga",
    displayName: "IGA",
    origin: "https://www.iga.net",
    paths: ["/fr/epicerie"],
  },
  {
    id: "superc",
    displayName: "Super C",
    origin: "https://www.superc.ca",
    paths: ["/"],
  },
  {
    id: "walmart",
    displayName: "Walmart",
    origin: "https://www.walmart.ca",
    paths: ["/en/search?q=milk", "/fr/recherche?q=lait"],
  },
  {
    id: "costco",
    displayName: "Costco",
    origin: "https://www.costco.ca",
    paths: ["/CatalogSearch?keyword=milk"],
    parse: parseCostcoHtml,
  },
];

function delayMs(): number {
  const parsed = Number(process.env.SCRAPE_DELAY_MS ?? 3000);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 3000;
}

async function rateLimit(host: string) {
  const wait = (lastHit.get(host) ?? 0) + delayMs() - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastHit.set(host, Date.now());
}

async function fetchText(url: string): Promise<{ status: number; body: string; ok: boolean }> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": BOT_UA, accept: "text/html,application/xml,text/plain" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.text();
    const challenge = /cf-mitigated|captcha|access denied|just a moment/i.test(body.slice(0, 800));
    return { status: response.status, body, ok: response.ok && !challenge };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return { status: 0, body: message, ok: false };
  }
}

function blockedStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status === 0;
}

export function parseCostcoHtml(html: string): ParsedStoreProduct[] {
  if (/not able to find a match|BAILOUT_TO_CLIENT_SIDE_RENDERING|kpsdk/i.test(html) && !/\$\d+\.\d{2}/.test(html.slice(0, 5000))) {
    return [];
  }
  return [];
}

function matchesQuery(product: ParsedStoreProduct, query: string): boolean {
  const wanted = query.trim();
  if (!wanted) return true;
  if (fold(product.name).includes(fold(wanted))) return true;
  const target = matchIngredientName(wanted);
  const found = matchIngredientName(product.name);
  return Boolean(target && found && target.itemKey === found.itemKey);
}

export async function runAdapter(spec: AdapterSpec, query = ""): Promise<ScrapeReport> {
  if (!isStoreEnabled(spec.id)) {
    return { storeId: spec.id, displayName: spec.displayName, state: "disabled", detail: "Kill switch is off.", products: [] };
  }
  const host = new URL(spec.origin).host;
  await rateLimit(host);
  const robotsResponse = await fetchText(`${spec.origin}/robots.txt`);
  if (!robotsResponse.ok || blockedStatus(robotsResponse.status)) {
    return {
      storeId: spec.id,
      displayName: spec.displayName,
      state: "blocked",
      detail: `robots.txt responded ${robotsResponse.status || "with an error"}. No pages were fetched.`,
      products: [],
    };
  }
  const rules = parseRobots(robotsResponse.body);
  const allowed = spec.paths.filter((path) => pathAllowed(rules, path));
  if (!allowed.length) {
    return {
      storeId: spec.id,
      displayName: spec.displayName,
      state: "disallowed",
      detail: `robots.txt disallows ${spec.paths.join(", ")}. Those URLs were not fetched.`,
      products: [],
    };
  }

  const products: ParsedStoreProduct[] = [];
  let sawBlock = false;
  let lastStatus = 0;
  for (const path of allowed) {
    await rateLimit(host);
    const page = await fetchText(`${spec.origin}${path}`);
    lastStatus = page.status;
    if (!page.ok || blockedStatus(page.status)) {
      sawBlock = true;
      continue;
    }
    const parsed = spec.parse?.(page.body) ?? [];
    products.push(...parsed.filter((product) => matchesQuery(product, query)));
  }

  if (products.length) {
    return {
      storeId: spec.id,
      displayName: spec.displayName,
      state: "ok",
      detail: `${products.length} produits lus sur une page autorisée par robots.txt.`,
      products,
    };
  }
  if (sawBlock) {
    return {
      storeId: spec.id,
      displayName: spec.displayName,
      state: "blocked",
      detail: `The site returned ${lastStatus || "a block"} for an allowed URL. Not retried with another identity.`,
      products: [],
    };
  }
  return {
    storeId: spec.id,
    displayName: spec.displayName,
    state: "empty",
    detail: "The page loaded, but it did not include shelf prices (often a client-rendered shell or bot wall). No bypass was attempted.",
    products: [],
  };
}

export async function runAllAdapters(query = ""): Promise<ScrapeReport[]> {
  const reports: ScrapeReport[] = [];
  for (const spec of ADAPTERS) {
    try {
      reports.push(await runAdapter(spec, query));
    } catch (error) {
      reports.push({
        storeId: spec.id,
        displayName: spec.displayName,
        state: "error",
        detail: error instanceof Error ? error.message : "adapter error",
        products: [],
      });
    }
  }
  return reports;
}

export function adapterById(id: string): AdapterSpec | undefined {
  return ADAPTERS.find((adapter) => adapter.id === id);
}
