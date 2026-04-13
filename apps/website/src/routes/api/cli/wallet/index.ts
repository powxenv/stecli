import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { wallets } from "#/db/schema";
import { db } from "#/db/index.ts";
import { decryptSecretKey } from "#/lib/server/crypto.ts";
import { authenticate } from "#/lib/server/auth.ts";

export const Route = createFileRoute("/api/cli/wallet/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const email = await authenticate(request);
        if (!email) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const result = await db.select().from(wallets).where(eq(wallets.email, email)).limit(1);

        if (result.length === 0) {
          return Response.json({ ok: false, error: "No wallet found" }, { status: 404 });
        }

        const wallet = result[0];
        const secretKey = decryptSecretKey(wallet.encryptedSecretKey, wallet.salt, wallet.iv);

        return Response.json({
          ok: true,
          wallet: {
            email: wallet.email,
            publicKey: wallet.publicKey,
            network: wallet.network,
            secretKey,
            createdAt: wallet.createdAt,
          },
        });
      },
    },
  },
});
