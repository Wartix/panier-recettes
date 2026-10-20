import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST() {
  const user = await prisma.user.findUnique({ where: { email: "demo@panierrecettes.ca" } });
  if (!user) return Response.json({ error: "no_demo" }, { status: 404 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());
  return Response.json({ ok: true });
}
