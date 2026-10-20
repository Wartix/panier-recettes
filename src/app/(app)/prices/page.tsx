import { PricesScreen } from "@/components/prices-screen";
import { loadPrices } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function PricesPage() {
  const user = await requireUser();
  return <PricesScreen data={await loadPrices(user.id)} />;
}
