import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  await prisma.pantryItem.deleteMany({ where: { id, userId: user.id } });
  return Response.json({ ok: true });
}
