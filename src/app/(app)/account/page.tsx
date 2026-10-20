import { AccountScreen } from "@/components/account-screen";
import { requireUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await requireUser();
  return <AccountScreen name={user.name} email={user.email} postalCode={user.postalCode} />;
}
