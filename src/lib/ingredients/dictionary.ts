export type IngredientDef = {
  key: string;
  fr: string;
  en: string;
  category: string;
  aliases: string[];
  /** Grams per millilitre, used when a recipe gives cups and the shelf price is by weight. */
  density?: number;
  /** Typical weight of one piece, so "1 onion" can meet a per-kilogram price. */
  pieceGrams?: number;
};

export const INGREDIENTS: IngredientDef[] = [
  { key: "ground_beef", fr: "bœuf haché", en: "ground beef", category: "meat", aliases: ["boeuf hache", "viande hachee", "minced beef", "lean ground beef", "boeuf hache maigre", "pain de viande"] },
  { key: "chicken_breast", fr: "poitrine de poulet", en: "chicken breast", category: "meat", aliases: ["blanc de poulet", "poulet poitrine", "poitrine poulet", "chicken breasts", "boneless skinless chicken breast", "poitrines de poulet"] },
  { key: "chicken_thigh", fr: "haut de cuisse de poulet", en: "chicken thigh", category: "meat", aliases: ["cuisse de poulet", "cuisses de poulet", "chicken thighs", "thighs"] },
  { key: "chicken", fr: "poulet", en: "chicken", category: "meat", aliases: ["poulet entier", "whole chicken"] },
  { key: "egg", fr: "œuf", en: "egg", category: "eggs", aliases: ["oeuf", "oeufs", "eggs", "gros oeufs", "large eggs"] },
  { key: "milk", fr: "lait", en: "milk", category: "dairy", density: 1.03, aliases: ["lait 2%", "2% milk", "lait entier", "whole milk"] },
  { key: "butter", fr: "beurre", en: "butter", category: "dairy", density: 0.96, aliases: ["beurre sale", "salted butter", "unsalted butter", "beurre non sale"] },
  { key: "cheddar", fr: "cheddar", en: "cheddar", category: "dairy", aliases: ["fromage cheddar", "sharp cheddar", "cheddar fort", "cheddar doux"] },
  { key: "parmesan", fr: "parmesan", en: "parmesan", category: "dairy", aliases: ["parmigiano", "fromage parmesan", "parmigiano reggiano"] },
  { key: "mozzarella", fr: "mozzarella", en: "mozzarella", category: "dairy", aliases: ["fromage mozzarella"] },
  { key: "yogurt", fr: "yogourt", en: "yogurt", category: "dairy", density: 1.03, aliases: ["yoghurt", "greek yogurt", "yogourt grec", "yaourt"] },
  { key: "cream", fr: "crème", en: "cream", category: "dairy", density: 1, aliases: ["creme", "heavy cream", "creme 35", "whipping cream", "creme liquide", "creme sure", "sour cream"] },
  { key: "onion", fr: "oignon", en: "onion", category: "produce", pieceGrams: 150, aliases: ["oignons", "yellow onion", "oignon jaune"] },
  { key: "green_onion", fr: "oignon vert", en: "green onion", category: "produce", aliases: ["oignons verts", "scallion", "scallions", "ciboule", "green onions"] },
  { key: "garlic", fr: "ail", en: "garlic", category: "produce", aliases: ["gousse d'ail", "gousses d'ail", "garlic clove", "garlic cloves"] },
  { key: "potato", fr: "pomme de terre", en: "potato", category: "produce", pieceGrams: 180, aliases: ["pommes de terre", "potatoes", "patate", "patates"] },
  { key: "sweet_potato", fr: "patate douce", en: "sweet potato", category: "produce", pieceGrams: 180, aliases: ["patates douces", "sweet potatoes"] },
  { key: "tomato", fr: "tomate", en: "tomato", category: "produce", pieceGrams: 120, aliases: ["tomates", "tomatoes", "tomate italienne"] },
  { key: "canned_tomato", fr: "tomates en dés", en: "diced tomatoes", category: "canned", density: 1, aliases: ["tomates en des", "canned tomatoes", "diced tomato", "tomates concassees", "tomates concassées", "whole tomatoes", "crushed tomatoes", "tomates entieres", "tomates italiennes en conserve"] },
  { key: "tomato_paste", fr: "pâte de tomates", en: "tomato paste", category: "canned", aliases: ["pate de tomates", "tomato puree", "concentre de tomates"] },
  { key: "corn", fr: "maïs", en: "corn", category: "canned", aliases: ["mais", "mais en creme", "creme de mais", "creamed corn", "canned corn", "mais en grains", "corn kernels"] },
  { key: "carrot", fr: "carotte", en: "carrot", category: "produce", pieceGrams: 60, aliases: ["carottes", "carrots"] },
  { key: "zucchini", fr: "courgette", en: "zucchini", category: "produce", pieceGrams: 200, aliases: ["courgettes"] },
  { key: "eggplant", fr: "aubergine", en: "eggplant", category: "produce", pieceGrams: 300, aliases: ["aubergines"] },
  { key: "bell_pepper", fr: "poivron", en: "bell pepper", category: "produce", pieceGrams: 160, aliases: ["poivrons", "red pepper", "poivron rouge", "green pepper", "poivron vert"] },
  { key: "lemon", fr: "citron", en: "lemon", category: "produce", pieceGrams: 80, aliases: ["citrons", "lemons"] },
  { key: "lime", fr: "lime", en: "lime", category: "produce", pieceGrams: 60, aliases: ["limes", "citron vert", "citrons verts"] },
  { key: "apple", fr: "pomme", en: "apple", category: "produce", pieceGrams: 180, aliases: ["pommes", "apples"] },
  { key: "banana", fr: "banane", en: "banana", category: "produce", pieceGrams: 120, aliases: ["bananes", "bananas"] },
  { key: "rice", fr: "riz", en: "rice", category: "dry_goods", density: 0.85, aliases: ["riz blanc", "white rice", "riz jasmin", "jasmine rice"] },
  { key: "pasta", fr: "pâtes", en: "pasta", category: "dry_goods", aliases: ["pates", "spaghetti", "spaghettis", "nouilles", "noodles", "macaroni", "penne"] },
  { key: "flour", fr: "farine", en: "flour", category: "dry_goods", density: 0.53, aliases: ["farine tout usage", "all-purpose flour", "wheat flour", "farine blanche"] },
  { key: "sugar", fr: "sucre", en: "sugar", category: "dry_goods", density: 0.85, aliases: ["sucre blanc", "white sugar", "granulated sugar"] },
  { key: "olive_oil", fr: "huile d'olive", en: "olive oil", category: "condiments", density: 0.91, aliases: ["huile olive", "extra virgin olive oil", "huile d olive extra vierge", "huile d'olive extra vierge"] },
  { key: "vegetable_oil", fr: "huile végétale", en: "vegetable oil", category: "condiments", density: 0.91, aliases: ["huile vegetale", "canola oil", "huile de canola", "huile", "oil", "cooking oil"] },
  { key: "soy_sauce", fr: "sauce soya", en: "soy sauce", category: "condiments", density: 1.1, aliases: ["sauce soja", "soya sauce", "shoyu"] },
  { key: "miso", fr: "miso", en: "miso", category: "condiments", aliases: ["pate miso", "pâte miso", "miso paste", "pâte de miso"] },
  { key: "tofu", fr: "tofu", en: "tofu", category: "produce", aliases: ["tofu ferme", "firm tofu"] },
  { key: "chickpea", fr: "pois chiches", en: "chickpeas", category: "canned", aliases: ["pois chiche", "chana", "garbanzo", "garbanzo beans", "chiches"] },
  { key: "beans", fr: "haricots", en: "beans", category: "canned", aliases: ["black beans", "haricots noirs", "kidney beans", "haricots rouges", "lentilles", "lentils"] },
  { key: "cumin", fr: "cumin", en: "cumin", category: "condiments", aliases: ["cumin moulu", "ground cumin"] },
  { key: "garam_masala", fr: "garam masala", en: "garam masala", category: "condiments", aliases: ["masala"] },
  { key: "paprika", fr: "paprika", en: "paprika", category: "condiments", aliases: ["paprika fume", "smoked paprika", "paprika fumé"] },
  { key: "chipotle", fr: "chipotle", en: "chipotle", category: "condiments", aliases: ["chipotles", "piment chipotle", "chipotle in adobo", "chipotle en adobo"] },
  { key: "chili", fr: "piment en poudre", en: "chili powder", category: "condiments", aliases: ["chili powder", "poudre de chili", "chili flakes", "flocons de piment"] },
  { key: "ginger", fr: "gingembre", en: "ginger", category: "produce", aliases: ["fresh ginger", "gingembre frais", "ground ginger"] },
  { key: "cilantro", fr: "coriandre", en: "cilantro", category: "produce", aliases: ["coriander", "coriandre fraiche", "fresh cilantro", "coriandre fraîche"] },
  { key: "ground_coriander", fr: "coriandre moulue", en: "ground coriander", category: "condiments", aliases: ["coriander powder"] },
  { key: "basil", fr: "basilic", en: "basil", category: "produce", aliases: ["fresh basil", "basilic frais"] },
  { key: "thyme", fr: "thym", en: "thyme", category: "produce", aliases: ["thym frais", "fresh thyme", "thym seche"] },
  { key: "parsley", fr: "persil", en: "parsley", category: "produce", aliases: ["persil frais", "fresh parsley", "flat leaf parsley"] },
  { key: "salt", fr: "sel", en: "salt", category: "condiments", aliases: ["sea salt", "sel de mer", "kosher salt"] },
  { key: "pepper", fr: "poivre", en: "black pepper", category: "condiments", aliases: ["black pepper", "poivre noir", "ground black pepper"] },
  { key: "tortilla", fr: "tortilla", en: "tortilla", category: "bread", aliases: ["tortillas", "flour tortillas", "tortillas de ble", "tortillas de blé"] },
  { key: "bread", fr: "pain", en: "bread", category: "bread", aliases: ["white bread", "pain blanc", "baguette", "sandwich bread"] },
  { key: "vinegar", fr: "vinaigre", en: "vinegar", category: "condiments", density: 1, aliases: ["vinaigre de cidre", "apple cider vinegar", "vinaigre blanc", "white vinegar"] },
  { key: "broth", fr: "bouillon", en: "broth", category: "canned", density: 1, aliases: ["bouillon de poulet", "chicken broth", "chicken stock", "dashi", "bouillon de legumes"] },
  { key: "honey", fr: "miel", en: "honey", category: "condiments", density: 1.42, aliases: ["liquid honey"] },
  { key: "spinach", fr: "épinards", en: "spinach", category: "produce", aliases: ["epinards", "baby spinach", "jeunes epinards"] },
  { key: "shrimp", fr: "crevettes", en: "shrimp", category: "seafood", aliases: ["crevette", "prawns", "crevettes nordiques"] },
  { key: "salmon", fr: "saumon", en: "salmon", category: "seafood", aliases: ["salmon fillet", "filet de saumon"] },
  { key: "lettuce", fr: "laitue", en: "lettuce", category: "produce", pieceGrams: 300, aliases: ["romaine", "laitue romaine", "iceberg"] },
  { key: "cucumber", fr: "concombre", en: "cucumber", category: "produce", pieceGrams: 200, aliases: ["concombres"] },
  { key: "avocado", fr: "avocat", en: "avocado", category: "produce", pieceGrams: 170, aliases: ["avocats"] },
  { key: "mushroom", fr: "champignon", en: "mushroom", category: "produce", pieceGrams: 20, aliases: ["champignons", "mushrooms"] },
  { key: "mayonnaise", fr: "mayonnaise", en: "mayonnaise", category: "condiments", aliases: ["mayo"] },
  { key: "peanut_butter", fr: "beurre d'arachide", en: "peanut butter", category: "condiments", aliases: ["beurre de peanut"] },
  { key: "coffee", fr: "café", en: "coffee", category: "dry_goods", aliases: ["cafe", "cafe moulu", "ground coffee"] },
  { key: "bacon", fr: "bacon", en: "bacon", category: "meat", aliases: ["lard", "bacon tranche"] },
  { key: "broccoli", fr: "brocoli", en: "broccoli", category: "produce", pieceGrams: 300, aliases: ["broccoli crown"] },
  { key: "cabbage", fr: "chou", en: "cabbage", category: "produce", pieceGrams: 800, aliases: ["green cabbage", "chou vert"] },
  { key: "sesame", fr: "sésame", en: "sesame", category: "condiments", aliases: ["sesame", "sesame seeds", "graines de sesame", "sesame oil", "huile de sesame"] },
  { key: "cornstarch", fr: "fécule de maïs", en: "cornstarch", category: "dry_goods", aliases: ["fecule", "corn starch", "fecule de mais"] },
  { key: "baking_powder", fr: "poudre à pâte", en: "baking powder", category: "dry_goods", aliases: ["poudre a pate", "levure chimique"] },
  { key: "yeast", fr: "levure", en: "yeast", category: "dry_goods", aliases: ["levure seche", "dry yeast"] },
  { key: "water", fr: "eau", en: "water", category: "other", density: 1, aliases: ["eau froide", "cold water"] },
  { key: "turmeric", fr: "curcuma", en: "turmeric", category: "condiments", aliases: ["turmeric powder"] },
  { key: "cinnamon", fr: "cannelle", en: "cinnamon", category: "condiments", aliases: ["ground cinnamon"] },
  { key: "bay", fr: "laurier", en: "bay leaf", category: "condiments", aliases: ["bay leaf", "bay leaves", "feuille de laurier"] },
];

const BY_KEY = new Map(INGREDIENTS.map((item) => [item.key, item]));

export function getIngredient(key: string): IngredientDef | undefined {
  return BY_KEY.get(key);
}

export function fold(input: string): string {
  return input
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function aliasesOf(def: IngredientDef): string[] {
  return [def.fr, def.en, def.key.replace(/_/g, " "), ...def.aliases];
}
