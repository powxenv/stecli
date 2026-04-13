import { env } from "#/env.ts";
import { drizzle } from "drizzle-orm/neon-http";

export const db = drizzle(env.NEON_DATABASE_URL);
