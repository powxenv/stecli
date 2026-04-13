import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { Keypair } from "@stellar/stellar-base";
import { walletSessions, wallets } from "#/db/schema";
import { db } from "#/db/index.ts";
import { encryptSecretKey, decryptSecretKey } from "#/lib/server/crypto.ts";

export const Route = createFileRoute("/api/cli/wallet/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const email = await authenticate(request);
        if (!email) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const existing = await db.select().from(wallets).where(eq(wallets.email, email)).limit(1);

        if (existing.length > 0) {
          const wallet = existing[0];
          const secretKey = decryptSecretKey(wallet.encryptedSecretKey, wallet.salt, wallet.iv);
          return Response.json({
            ok: true,
            created: false,
            wallet: {
              email: wallet.email,
              publicKey: wallet.publicKey,
              network: wallet.network,
              secretKey,
              createdAt: wallet.createdAt,
            },
          });
        }

        const body = (await request.json()) as { network?: string };
        const network = body.network ?? "testnet";
        const kp = Keypair.random();
        const publicKey = kp.publicKey();
        const secretKey = kp.secret();

        const { encrypted, salt, iv } = encryptSecretKey(secretKey);

        await db.insert(wallets).values({
          email,
          publicKey,
          encryptedSecretKey: encrypted,
          salt,
          iv,
          network,
        });

        if (network === "testnet") {
          try {
            await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
          } catch {
            // Friendbot funding failed — wallet created but unfunded
          }
        }

        return Response.json({
          ok: true,
          created: true,
          wallet: { email, publicKey, network, secretKey },
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
