import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const body = await readBody<{ postalCode?: string }>(request);
  const postalCode = (body.postalCode ?? user.postalCode).replace(/\s+/g, "").toUpperCase();
  await prisma.user.update({ where: { id: user.id }, data: { postalCode } });
  return Response.json({ ok: true });
}
