import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { wallets } from "#/db/schema";
import { getDb } from "#/db/index.ts";
import { authenticate } from "#/lib/server/auth.ts";

export const Route = createFileRoute("/api/cli/wallet/address")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const email = await authenticate(request);
        if (!email) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();

        const result = await db.select().from(wallets).where(eq(wallets.email, email)).limit(1);

        if (result.length === 0) {
          return Response.json({ ok: false, error: "No wallet found" }, { status: 404 });
        }

        const wallet = result[0];

        return Response.json({
          ok: true,
          address: {
            publicKey: wallet.publicKey,
            network: wallet.network,
            email: wallet.email,
          },
        });
      },
    },
  },
});
