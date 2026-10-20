export type SeedRecipe = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  cuisine: string;
  origin: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  lines: string[];
  steps: string[];
  stepsEn: string[];
  tags: string;
};

export const SEED_RECIPES: SeedRecipe[] = [
  {
    title: "Pâté chinois",
    titleEn: "Québec shepherd's pie",
    description: "Le classique de semaine: bœuf, maïs en crème, purée.",
    descriptionEn: "The weeknight classic: beef, cream corn, and mashed potato.",
    cuisine: "Québécoise",
    origin: "Canada",
    servings: 6,
    prepMinutes: 25,
    cookMinutes: 35,
    lines: ["800 g de bœuf haché", "1 oignon", "1 kg de pommes de terre", "341 ml de maïs en crème", "30 g de beurre", "125 ml de lait", "sel"],
    steps: [
      "Faire revenir l'oignon et le bœuf haché dans une poêle jusqu'à ce que la viande colore.",
      "Cuire les pommes de terre à l'eau, les écraser avec le beurre et le lait.",
      "Étendre la viande dans un plat, couvrir de maïs puis de purée.",
      "Cuire au four à 190 °C environ 35 minutes, jusqu'à ce que le dessus dore.",
    ],
    stepsEn: [
      "Brown the onion and ground beef in a skillet.",
      "Boil the potatoes and mash them with the butter and milk.",
      "Spread the beef in a dish, then the corn, then the mash.",
      "Bake at 190 °C for about 35 minutes, until the top colours.",
    ],
    tags: "semaine,four",
  },
  {
    title: "Ratatouille",
    titleEn: "Ratatouille",
    description: "Légumes d'été mijotés, à la manière provençale.",
    descriptionEn: "Summer vegetables stewed the Provençal way.",
    cuisine: "Française",
    origin: "France",
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 40,
    lines: ["1 aubergine", "2 courgettes", "1 poivron", "4 tomates", "1 oignon", "3 gousses d'ail", "30 ml d'huile d'olive", "thym", "sel"],
    steps: [
      "Couper tous les légumes en dés à peu près égaux.",
      "Faire suer l'oignon et l'ail dans l'huile d'olive.",
      "Ajouter l'aubergine, les courgettes et le poivron, puis les tomates et le thym.",
      "Mijoter à couvert environ 40 minutes. Saler en fin de cuisson.",
    ],
    stepsEn: [
      "Cut the vegetables into even pieces.",
      "Soften the onion and garlic in olive oil.",
      "Add the eggplant, zucchini, pepper, then the tomatoes and thyme.",
      "Stew, covered, for about 40 minutes. Salt at the end.",
    ],
    tags: "légumes,mijoté",
  },
  {
    title: "Chana masala",
    titleEn: "Chana masala",
    description: "Pois chiches épicés, un plat du nord de l'Inde.",
    descriptionEn: "Spiced chickpeas from northern India.",
    cuisine: "Indienne",
    origin: "India",
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    lines: ["540 ml de pois chiches", "1 oignon", "3 gousses d'ail", "15 g de gingembre", "398 ml de tomates en dés", "5 g de garam masala", "3 g de cumin", "15 ml d'huile", "coriandre fraîche (facultatif)"],
    steps: [
      "Émincer l'oignon, l'ail et le gingembre.",
      "Les faire revenir dans l'huile avec le cumin.",
      "Ajouter les tomates, le garam masala et les pois chiches égouttés.",
      "Mijoter 30 minutes. Parsemer de coriandre si vous en avez.",
    ],
    stepsEn: [
      "Chop the onion, garlic, and ginger.",
      "Fry them in oil with the cumin.",
      "Add the tomatoes, garam masala, and drained chickpeas.",
      "Simmer 30 minutes. Scatter cilantro on top if you have it.",
    ],
    tags: "légumineuses,épicé",
  },
  {
    title: "Tinga de poulet",
    titleEn: "Chicken tinga",
    description: "Poulet effiloché au chipotle, pour garnir des tortillas.",
    descriptionEn: "Shredded chipotle chicken for tucking into tortillas.",
    cuisine: "Mexicaine",
    origin: "Mexico",
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    lines: ["600 g de poitrine de poulet", "1 oignon", "2 gousses d'ail", "398 ml de tomates en dés", "15 g de chipotle", "15 ml de vinaigre", "8 tortillas"],
    steps: [
      "Pocher ou braiser le poulet jusqu'à ce qu'il s'effiloche.",
      "Faire revenir l'oignon et l'ail, puis ajouter les tomates, le chipotle et le vinaigre.",
      "Remettre le poulet dans la sauce et laisser réduire un peu.",
      "Servir dans les tortillas chaudes.",
    ],
    stepsEn: [
      "Simmer the chicken until it shreds.",
      "Fry the onion and garlic, then add the tomatoes, chipotle, and vinegar.",
      "Return the chicken to the sauce and let it thicken a little.",
      "Serve in warm tortillas.",
    ],
    tags: "semaine,piquant",
  },
  {
    title: "Soupe miso",
    titleEn: "Miso soup",
    description: "Un bol rapide: bouillon, miso, tofu, oignon vert.",
    descriptionEn: "A quick bowl: broth, miso, tofu, and green onion.",
    cuisine: "Japonaise",
    origin: "Japan",
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 8,
    lines: ["800 ml de bouillon", "30 g de miso", "100 g de tofu", "2 oignons verts", "5 ml de sauce soya"],
    steps: [
      "Chauffer le bouillon sans le laisser bouillir.",
      "Délayer le miso dans une louche de bouillon, puis le rendre à la casserole.",
      "Ajouter le tofu en dés et la sauce soya.",
      "Servir avec l'oignon vert ciselé.",
    ],
    stepsEn: [
      "Warm the broth without letting it boil.",
      "Whisk the miso into a ladle of broth, then return it to the pot.",
      "Add the diced tofu and soy sauce.",
      "Serve with sliced green onion.",
    ],
    tags: "rapide,soupe",
  },
  {
    title: "Spaghetti sauce tomate",
    titleEn: "Tomato spaghetti",
    description: "Sauce courte à l'ail et à l'huile d'olive.",
    descriptionEn: "A short sauce of garlic and olive oil.",
    cuisine: "Italienne",
    origin: "Italy",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    lines: ["400 g de spaghetti", "796 ml de tomates en dés", "3 gousses d'ail", "30 ml d'huile d'olive", "basilic frais", "parmesan (facultatif)"],
    steps: [
      "Cuire les spaghetti dans beaucoup d'eau salée.",
      "Faire dorer l'ail dans l'huile, puis ajouter les tomates.",
      "Laisser réduire une dizaine de minutes.",
      "Mélanger aux pâtes. Parmesan si vous voulez.",
    ],
    stepsEn: [
      "Boil the spaghetti in well salted water.",
      "Brown the garlic in the oil, then add the tomatoes.",
      "Reduce for about ten minutes.",
      "Toss with the pasta. Parmesan if you like.",
    ],
    tags: "pâtes,semaine",
  },
];

export const SEED_PANTRY = [
  { name: "Huile d'olive", line: "500 ml d'huile d'olive", location: "pantry", days: 200 },
  { name: "Ail", line: "8 gousses d'ail", location: "pantry", days: 30 },
  { name: "Sel", line: "sel", quantity: 1, unit: "ct", itemKey: "salt", location: "pantry", days: null },
  { name: "Spaghetti", line: "500 g de spaghetti", location: "pantry", days: 400 },
  { name: "Riz", line: "900 g de riz", location: "pantry", days: 400 },
  { name: "Farine", line: "1 kg de farine", location: "pantry", days: 300 },
  { name: "Oignons", line: "3 oignons", location: "pantry", days: 21 },
  { name: "Pommes de terre", line: "300 g de pommes de terre", location: "pantry", days: 18 },
  { name: "Beurre", line: "200 g de beurre", location: "fridge", days: 21 },
  { name: "Lait 2 %", line: "2 l de lait", location: "fridge", days: 5 },
  { name: "Œufs", line: "6 oeufs", location: "fridge", days: 12 },
  { name: "Cumin", line: "30 g de cumin", location: "pantry", days: 500 },
  { name: "Sauce soya", line: "250 ml de sauce soya", location: "pantry", days: 300 },
  { name: "Yogourt", line: "500 g de yogourt", location: "fridge", days: 2 },
  { name: "Cheddar", line: "200 g de cheddar", location: "fridge", days: 10 },
  { name: "Tortillas", line: "4 tortillas", location: "fridge", days: 3 },
  { name: "Poivre", line: "poivre", quantity: 1, unit: "ct", itemKey: "pepper", location: "pantry", days: null },
];

export const SEED_PLAN = [
  { dayIndex: 0, recipe: "Pâté chinois", meal: "dinner" },
  { dayIndex: 1, recipe: "Spaghetti sauce tomate", meal: "dinner" },
  { dayIndex: 2, recipe: "Chana masala", meal: "dinner" },
  { dayIndex: 3, recipe: "Tinga de poulet", meal: "dinner" },
  { dayIndex: 4, recipe: "Soupe miso", meal: "dinner" },
  { dayIndex: 5, recipe: "Ratatouille", meal: "dinner" },
];
