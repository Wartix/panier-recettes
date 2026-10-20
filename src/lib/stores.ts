export const STORES = [
  { id: "maxi", name: "Maxi", area: "Chomedey" },
  { id: "provigo", name: "Provigo", area: "Sainte-Rose" },
  { id: "iga", name: "IGA", area: "Vimont" },
  { id: "metro", name: "Metro", area: "Pont-Viau" },
  { id: "superc", name: "Super C", area: "Laval-des-Rapides" },
  { id: "walmart", name: "Walmart", area: "Chomedey" },
  { id: "costco", name: "Costco", area: "Saint-Martin" },
  { id: "statcan", name: "Statistique Canada", area: "Québec" },
] as const;

export function storeName(id: string): string {
  return STORES.find((store) => store.id === id)?.name ?? id;
}

export function storeArea(id: string): string {
  return STORES.find((store) => store.id === id)?.area ?? "";
}
