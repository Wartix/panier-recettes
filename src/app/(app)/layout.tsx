import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const postal = user.postalCode.length === 6 ? `${user.postalCode.slice(0, 3)} ${user.postalCode.slice(3)}` : user.postalCode;
  return <AppShell postalCode={postal}>{children}</AppShell>;
}
