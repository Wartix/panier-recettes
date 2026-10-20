import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { readBody } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await readBody<{ email?: string; password?: string; name?: string }>(request);
  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() || email.split("@")[0] || "Cuisine";
  const password = body.password ?? "";
  if (!email.includes("@") || password.length < 8) return Response.json({ error: "invalid" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 8),
      postalCode: (process.env.DEFAULT_POSTAL_CODE || "H7T2P1").replace(/\s+/g, "").toUpperCase(),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());
  return Response.json({ ok: true });
}
