#!/usr/bin/env python3
"""Optional recipe-scrapers fallback. Reads HTML we already fetched."""

import json
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "usage: scrape.py URL HTMLFILE"}))
        return 2
    url, path = sys.argv[1], sys.argv[2]
    try:
        html = open(path, encoding="utf-8", errors="replace").read()
    except OSError as error:
        print(json.dumps({"ok": False, "error": str(error)}))
        return 0
    try:
        from recipe_scrapers import scrape_html
    except Exception:
        print(json.dumps({"ok": False, "error": "recipe-scrapers not installed"}))
        return 0
    try:
        try:
            scraped = scrape_html(html, org_url=url, wild_mode=True)
        except TypeError:
            scraped = scrape_html(html, org_url=url)
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)[:300]}))
        return 0

    def grab(method: str, default=None):
        try:
            return getattr(scraped, method)()
        except Exception:
            return default

    instructions = grab("instructions_list", None) or []
    if not instructions:
        text = grab("instructions", "") or ""
        instructions = [line.strip() for line in str(text).split("\n") if line.strip()]
    print(
        json.dumps(
            {
                "ok": True,
                "title": grab("title", "") or "",
                "ingredients": grab("ingredients", []) or [],
                "instructions": instructions,
                "yields": grab("yields", "") or "",
                "image": grab("image", "") or "",
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
