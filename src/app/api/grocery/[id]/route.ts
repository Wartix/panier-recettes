import { prisma } from "@/lib/db";
import { readBody, requireApiUser } from "@/lib/api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const body = await readBody<{ checked?: boolean }>(request);
  await prisma.groceryItem.updateMany({ where: { id, userId: user.id }, data: { checked: Boolean(body.checked) } });
  return Response.json({ ok: true });
}
