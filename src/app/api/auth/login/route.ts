import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { readBody } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await readBody<{ email?: string; password?: string }>(request);
  const email = body.email?.trim().toLowerCase() ?? "";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(body.password ?? "", user.passwordHash))) {
    return Response.json({ error: "invalid" }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());
  return Response.json({ ok: true });
}
