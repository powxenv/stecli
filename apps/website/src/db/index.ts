import { env } from "#/env.ts";
import { createClient } from "@neondatabase/neon-js";

export const client = createClient({
  auth: {
    url: env.VITE_NEON_AUTH_URL,
  },
  dataApi: {
    url: env.NEON_DATA_API_URL,
  },
});
