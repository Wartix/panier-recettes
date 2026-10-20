import { getCurrentUser } from "@/lib/session";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function readBody<T>(request: Request): Promise<T> {
  return (await request.json().catch(() => ({}))) as T;
}
