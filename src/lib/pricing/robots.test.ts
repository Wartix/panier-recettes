import { describe, expect, it } from "vitest";
import { parseRobots, pathAllowed } from "@/lib/pricing/robots";

const WALMART = `
User-agent: *
Disallow: /search/*
Disallow: /en/search
Disallow: /en/ip/*
Allow: /en/ip/*/*
`;

const METRO = `
User-agent: *
Disallow: *filter=*
Disallow: *keywords=*
Disallow: /mon-compte/
`;

describe("robots.txt", () => {
  it("blocks Walmart search and allows a product path with two segments", () => {
    const rules = parseRobots(WALMART);
    expect(pathAllowed(rules, "/en/search?q=milk")).toBe(false);
    expect(pathAllowed(rules, "/search/milk")).toBe(false);
    expect(pathAllowed(rules, "/en/ip/milk/6000191275")).toBe(true);
  });

  it("blocks Metro query filters and allows a thematic listing", () => {
    const rules = parseRobots(METRO);
    expect(pathAllowed(rules, "/epicerie-en-ligne/recherche?filter=lait")).toBe(false);
    expect(pathAllowed(rules, "/epicerie-en-ligne/paniers-thematiques/produits-d-ici")).toBe(true);
  });
});
