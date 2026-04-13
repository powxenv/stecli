import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { walletSessions, wallets } from "#/db/schema";
import { db } from "#/db/index.ts";

export const Route = createFileRoute("/api/cli/wallet/address")({
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

async function authenticate(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
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
