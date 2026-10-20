import { PlanScreen } from "@/components/plan-screen";
import { loadPlan } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function PlanPage() {
  const user = await requireUser();
  return <PlanScreen data={await loadPlan(user.id)} />;
}
