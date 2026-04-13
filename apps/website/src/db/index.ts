import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/neon-http";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    _db = drizzle(env.NEON_DATABASE_URL);
  }
  return _db;
}
