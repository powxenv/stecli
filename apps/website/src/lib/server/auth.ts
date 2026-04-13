import { eq } from "drizzle-orm";
import { walletSessions } from "#/db/schema";
import { getDb } from "#/db/index.ts";

export async function authenticate(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const db = getDb();
  const result = await db
    .select()
    .from(walletSessions)
    .where(eq(walletSessions.token, token))
    .limit(1);

  if (result.length === 0) return null;

  const session = result[0];
  if (new Date() > session.expiresAt) return null;

  return session.email;
}
