# Grocery price adapters

Each Quebec banner is one entry in `src/lib/pricing/scrape.ts` behind the same report shape: `ok`, `disabled`, `disallowed`, `blocked`, `empty`, or `error`. A bad change on one site fails that adapter only.

## Rules the code follows

- User agent is `PanierRecettesBot/0.1`. It identifies the app. It is not a browser impersonation meant to slip past a block.
- `robots.txt` is fetched first. If that file itself is blocked, no catalog page is requested.
- Disallowed paths are not fetched. Walmart search URLs are in this bucket on purpose, so the adapter can show `disallowed` without hitting `/search`.
- A 401, 403, 429, or a captcha / Cloudflare interstitial is `blocked`. The same URL is not retried with another user agent, a headless browser, or a private API.
- `SCRAPE_DELAY_MS` (default 3000) spaces requests to one host.
- `STORE_MAXI=off` (and the same for `PROVIGO`, `IGA`, `METRO`, `SUPERC`, `WALMART`, `COSTCO`) skips that adapter.
- Observations store the time, store id, postal code (default `H7T2P1`, Laval), shelf price, unit-price text, and a sale flag.
- `SCRAPE_BROWSER` is unused. Turning it on does not launch Chromium.

## What a probe on 20 October 2026 found

Re-check with `npm run prices:probe`. The notes below are from that kind of request, from this environment, with the bot user agent.

| Store | Result | Why |
| --- | --- | --- |
| Metro | Works, narrowly | `robots.txt` allows `/epicerie-en-ligne/paniers-thematiques/produits-d-ici`. That page is server-rendered and includes `data-main-price`. Search URLs and `filter=` URLs are disallowed, so this is not a full catalog. |
| Maxi | Blocked | `robots.txt` is readable and allows category paths, but those pages return 403. Not retried. |
| Provigo | Blocked | Same Loblaw pattern as Maxi. |
| IGA | Blocked | `robots.txt` itself returns 403, so no page is fetched. |
| Super C | Blocked | Cloudflare 403 on `robots.txt` / the homepage. |
| Walmart Canada | Disallowed | `robots.txt` disallows `/en/search` and `/fr/recherche`. Those paths are not requested. The grocery shell that does load has no shelf prices in the HTML. |
| Costco Canada | Disallowed | `robots.txt` contains `Disallow: /CatalogSearch*` (older copies of that rule are commented out; the live rule is not). The search URL is not fetched. |

Fixture coverage for the Metro parser lives in `fixtures/metro-listing.html` and `src/lib/pricing/adapters/metro.test.ts`, so the parser still has a test when the live page changes.

## Other price sources

- Receipt text (`/receipts`) writes a `receipt` observation at the price actually paid.
- Statistics Canada table 18-10-0245, Quebec rows, is snapshotted in `data/statcan-quebec.json` and stored as store id `statcan`. Those rows are estimates. They fill a missing ingredient and are not counted as a store in a split.

## Terms

Automated collection can violate a grocer's terms of service even when `robots.txt` allows the URL. This MVP is a personal-scale, rate-limited reader with a kill switch, not a feed you should republish. If a banner asks you to stop, set its `STORE_*` variable to `off`.
