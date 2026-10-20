export const SEED_STORES = ["maxi", "provigo", "iga", "metro", "superc", "walmart", "costco"] as const;

export type SeedPrice = {
  itemKey: string;
  name: string;
  packageQty: number;
  packageUnit: string;
  loose: boolean;
  /** Cents, in SEED_STORES order. */
  prices: number[];
  sale?: { store: (typeof SEED_STORES)[number]; cents: number };
};

export const SEED_PRICES: SeedPrice[] = [
  { itemKey: "ground_beef", name: "Bœuf haché maigre", packageQty: 1000, packageUnit: "g", loose: true, prices: [1799, 2199, 2299, 2099, 1999, 1899, 2099], sale: { store: "maxi", cents: 1399 } },
  { itemKey: "chicken_breast", name: "Poitrine de poulet", packageQty: 1000, packageUnit: "g", loose: true, prices: [1899, 1999, 2099, 1949, 1649, 1799, 1899], sale: { store: "superc", cents: 1299 } },
  { itemKey: "butter", name: "Beurre salé", packageQty: 454, packageUnit: "g", loose: false, prices: [649, 699, 749, 599, 679, 629, 699], sale: { store: "metro", cents: 449 } },
  { itemKey: "milk", name: "Lait 2 %", packageQty: 2000, packageUnit: "ml", loose: false, prices: [589, 619, 649, 499, 569, 549, 629] },
  { itemKey: "egg", name: "Œufs gros", packageQty: 12, packageUnit: "ct", loose: false, prices: [499, 529, 549, 479, 399, 459, 519] },
  { itemKey: "onion", name: "Oignons jaunes", packageQty: 1000, packageUnit: "g", loose: true, prices: [449, 299, 499, 429, 399, 379, 459] },
  { itemKey: "potato", name: "Pommes de terre", packageQty: 1000, packageUnit: "g", loose: true, prices: [249, 399, 449, 379, 349, 329, 419] },
  { itemKey: "tomato", name: "Tomates italiennes", packageQty: 1000, packageUnit: "g", loose: true, prices: [599, 399, 649, 579, 529, 499, 619] },
  { itemKey: "canned_tomato", name: "Tomates en dés", packageQty: 796, packageUnit: "ml", loose: false, prices: [229, 219, 149, 209, 199, 189, 239] },
  { itemKey: "corn", name: "Maïs en crème", packageQty: 341, packageUnit: "ml", loose: false, prices: [129, 219, 239, 199, 189, 169, 209] },
  { itemKey: "olive_oil", name: "Huile d'olive", packageQty: 500, packageUnit: "ml", loose: false, prices: [1099, 1199, 1299, 1149, 999, 949, 699] },
  { itemKey: "pasta", name: "Spaghetti", packageQty: 500, packageUnit: "g", loose: false, prices: [249, 229, 269, 239, 219, 149, 199] },
  { itemKey: "rice", name: "Riz blanc", packageQty: 900, packageUnit: "g", loose: false, prices: [499, 479, 529, 459, 429, 399, 279] },
  { itemKey: "flour", name: "Farine tout usage", packageQty: 1000, packageUnit: "g", loose: false, prices: [349, 329, 369, 339, 319, 229, 299] },
  { itemKey: "chickpea", name: "Pois chiches", packageQty: 540, packageUnit: "ml", loose: false, prices: [199, 189, 119, 179, 169, 159, 189] },
  { itemKey: "garlic", name: "Ail", packageQty: 10, packageUnit: "clove", loose: false, prices: [99, 149, 169, 139, 129, 119, 159] },
  { itemKey: "tortilla", name: "Tortillas de blé", packageQty: 8, packageUnit: "ct", loose: false, prices: [429, 399, 449, 379, 279, 349, 399] },
  { itemKey: "cheddar", name: "Cheddar fort", packageQty: 400, packageUnit: "g", loose: false, prices: [799, 849, 899, 599, 749, 699, 799] },
  { itemKey: "yogurt", name: "Yogourt nature", packageQty: 650, packageUnit: "g", loose: false, prices: [529, 549, 579, 399, 479, 449, 529] },
  { itemKey: "soy_sauce", name: "Sauce soya", packageQty: 296, packageUnit: "ml", loose: false, prices: [349, 369, 389, 339, 319, 299, 219] },
  { itemKey: "miso", name: "Pâte miso", packageQty: 200, packageUnit: "g", loose: false, prices: [549, 499, 579, 529, 559, 479, 329] },
  { itemKey: "tofu", name: "Tofu ferme", packageQty: 350, packageUnit: "g", loose: false, prices: [299, 319, 349, 289, 269, 259, 189] },
  { itemKey: "broth", name: "Bouillon de poulet", packageQty: 900, packageUnit: "ml", loose: false, prices: [279, 269, 299, 249, 239, 179, 259] },
  { itemKey: "vinegar", name: "Vinaigre de cidre", packageQty: 500, packageUnit: "ml", loose: false, prices: [349, 329, 239, 319, 299, 279, 339] },
  { itemKey: "chipotle", name: "Chipotle en adobo", packageQty: 200, packageUnit: "g", loose: false, prices: [459, 439, 419, 329, 449, 399, 429] },
  { itemKey: "garam_masala", name: "Garam masala", packageQty: 40, packageUnit: "g", loose: false, prices: [399, 379, 269, 359, 389, 349, 419] },
  { itemKey: "ginger", name: "Gingembre frais", packageQty: 100, packageUnit: "g", loose: true, prices: [189, 119, 199, 169, 159, 149, 179] },
  { itemKey: "eggplant", name: "Aubergine", packageQty: 1000, packageUnit: "g", loose: true, prices: [549, 349, 599, 529, 499, 479, 579] },
  { itemKey: "zucchini", name: "Courgettes", packageQty: 1000, packageUnit: "g", loose: true, prices: [499, 299, 549, 479, 449, 429, 519] },
  { itemKey: "bell_pepper", name: "Poivrons", packageQty: 1000, packageUnit: "g", loose: true, prices: [699, 449, 749, 649, 599, 579, 699] },
  { itemKey: "green_onion", name: "Oignons verts", packageQty: 6, packageUnit: "ct", loose: false, prices: [119, 169, 189, 159, 149, 139, 179] },
  { itemKey: "parmesan", name: "Parmesan", packageQty: 200, packageUnit: "g", loose: false, prices: [699, 749, 799, 549, 679, 629, 749] },
  { itemKey: "cumin", name: "Cumin moulu", packageQty: 40, packageUnit: "g", loose: false, prices: [269, 259, 289, 249, 239, 189, 279] },
];
