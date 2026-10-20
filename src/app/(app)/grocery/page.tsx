import { GroceryScreen } from "@/components/grocery-screen";
import { loadGrocery } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function GroceryPage() {
  const user = await requireUser();
  return <GroceryScreen data={await loadGrocery(user.id)} />;
}
