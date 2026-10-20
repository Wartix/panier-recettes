export const LOCATIONS = ["fridge", "freezer", "pantry"] as const;
export type LocationId = (typeof LOCATIONS)[number];

export const CATEGORIES = [
  "produce",
  "dairy",
  "eggs",
  "meat",
  "seafood",
  "deli",
  "bread",
  "frozen",
  "canned",
  "dry_goods",
  "snacks",
  "beverages",
  "condiments",
  "leftovers",
  "household",
  "other",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

const RULES: [RegExp, CategoryId][] = [
  [/egg|oeuf/, "eggs"],
  [/shrimp|crevette|salmon|saumon|fish|poisson|tuna|thon/, "seafood"],
  [/chicken|poulet|beef|boeuf|pork|porc|turkey|dinde|bacon|steak/, "meat"],
  [/milk|lait|yogurt|yogourt|cheese|fromage|butter|beurre|cream|creme|cheddar|parmesan|mozzarella/, "dairy"],
  [/spinach|epinard|apple|pomme|lemon|citron|onion|oignon|garlic|ail|carrot|carotte|tomato|tomate|potato|patate|pepper|poivron|banana|banane|lettuce|laitue|cucumber|concombre|avocado|avocat|mushroom|champignon|zucchini|courgette|eggplant|aubergine|cilantro|coriandre|basil|basilic|parsley|persil|ginger|gingembre|lime|brocoli|cabbage|chou/, "produce"],
  [/rice|riz|pasta|pate|spaghetti|flour|farine|sugar|sucre|oat|bean|haricot|lentil|coffee|cafe|cereal/, "dry_goods"],
  [/bread|pain|tortilla|bagel|bun/, "bread"],
  [/canned|conserve|broth|bouillon|tomato sauce|sauce tomate/, "canned"],
  [/oil|huile|vinegar|vinaigre|sauce|ketchup|mustard|mayo|soy|soya|honey|miel|salt|sel|pepper|poivre|spice|cumin|masala|paprika/, "condiments"],
  [/juice|jus|soda|water|eau|tea|the|coffee drink/, "beverages"],
  [/frozen|congele/, "frozen"],
  [/soap|detergent|paper/, "household"],
];

export function inferCategory(name: string): CategoryId {
  const hay = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  for (const [rule, category] of RULES) {
    if (rule.test(hay)) return category;
  }
  return "other";
}
