import { HomeScreen } from "@/components/home-screen";
import { loadHome } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const data = await loadHome(user.id);
  return <HomeScreen data={data} />;
}
