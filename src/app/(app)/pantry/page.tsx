import { PantryScreen } from "@/components/pantry-screen";
import { loadPantry } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function PantryPage() {
  const user = await requireUser();
  return <PantryScreen items={await loadPantry(user.id)} />;
}
