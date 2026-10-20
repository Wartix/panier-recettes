import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { completeJson, getAiConfig } from "@/lib/ai";
import { bestJsonLdRecipe, detectLanguage, inferCuisine, type ImportedRecipe } from "@/lib/recipes/jsonld";
import { parseMicrodataRecipe } from "@/lib/recipes/microdata";

const RECIPE_UA = "Mozilla/5.0 (compatible; PanierRecettes/0.1; recipe import)";

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0.0.0.0" || host === "::") return true;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if ([a, b, Number(v4[3]), Number(v4[4])].some((part) => part > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;
  return false;
}

function assertPublicUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("bad_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad_url");
  if (url.username || url.password) throw new Error("bad_url");
  if (isBlockedHost(url.hostname)) throw new Error("bad_url");
  return url;
}

export async function fetchRecipeHtml(value: string): Promise<{ url: string; html: string }> {
  let current = assertPublicUrl(value);
  let response: Response | null = null;
  for (let hop = 0; hop < 5; hop += 1) {
    response = await fetch(current, {
      headers: { "user-agent": RECIPE_UA, accept: "text/html" },
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("fetch_redirect");
      current = assertPublicUrl(new URL(location, current).toString());
      continue;
    }
    break;
  }
  if (!response || !response.ok) throw new Error(`fetch_${response?.status ?? 0}`);
  const html = (await response.text()).slice(0, 1_200_000);
  return { url: current.toString(), html };
}

async function fromPython(url: string, html: string): Promise<ImportedRecipe | null> {
  const python = process.env.RECIPE_SCRAPER_PYTHON?.trim() || "python3";
  const script = join(process.cwd(), "services/recipe-scraper/scrape.py");
  const dir = await mkdtemp(join(tmpdir(), "panier-"));
  const file = join(dir, "page.html");
  try {
    await writeFile(file, html);
    const raw = await new Promise<string>((resolve, reject) => {
      const child = spawn(python, [script, url, file], { timeout: 20000 });
      let out = "";
      let err = "";
      child.stdout.on("data", (chunk) => {
        out += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        err += String(chunk);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0 && !out) reject(new Error(err || `python ${code}`));
        else resolve(out);
      });
    });
    const data = JSON.parse(raw) as {
      ok?: boolean;
      title?: string;
      ingredients?: string[];
      instructions?: string[];
      yields?: string;
      image?: string;
    };
    if (!data.ok || !data.title || !data.ingredients?.length) return null;
    const inferred = inferCuisine(data.title, "", data.ingredients);
    const blob = `${data.title} ${data.ingredients.join(" ")}`;
    return {
      title: data.title,
      description: "",
      cuisine: inferred.cuisine,
      origin: inferred.origin,
      language: detectLanguage(blob),
      imageUrl: data.image ?? "",
      servings: Number(String(data.yields ?? "").match(/\d+/)?.[0] ?? 4) || 4,
      prepMinutes: 0,
      cookMinutes: 0,
      ingredientLines: data.ingredients,
      steps: data.instructions ?? [],
      sourceUrl: url,
    };
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function fromAi(url: string, html: string): Promise<ImportedRecipe | null> {
  if (!getAiConfig().enabled) return null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 12000);
  try {
    const data = (await completeJson({
      system:
        "Extract a cooking recipe. Reply with JSON: {title, description, cuisine, servings, ingredients: string[], steps: string[]}. Keep ingredient lines as written.",
      user: `URL: ${url}\n\n${text}`,
    })) as {
      title?: string;
      description?: string;
      cuisine?: string;
      servings?: number;
      ingredients?: string[];
      steps?: string[];
    };
    if (!data.title || !data.ingredients?.length) return null;
    const inferred = inferCuisine(data.title, data.cuisine ?? "", data.ingredients);
    return {
      title: data.title,
      description: data.description ?? "",
      cuisine: inferred.cuisine,
      origin: inferred.origin,
      language: detectLanguage(`${data.title} ${data.ingredients.join(" ")}`),
      imageUrl: "",
      servings: data.servings && data.servings > 0 ? Math.round(data.servings) : 4,
      prepMinutes: 0,
      cookMinutes: 0,
      ingredientLines: data.ingredients,
      steps: data.steps ?? [],
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

export async function importRecipeFromUrl(value: string): Promise<ImportedRecipe> {
  const { url, html } = await fetchRecipeHtml(value);
  const structured = bestJsonLdRecipe(html, url) ?? parseMicrodataRecipe(html, url);
  if (structured && structured.ingredientLines.length >= 2) return structured;
  const scraped = await fromPython(url, html);
  if (scraped) return scraped;
  const ai = await fromAi(url, html);
  if (ai) return ai;
  throw new Error("import_failed");
}

export async function readHtmlFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}
