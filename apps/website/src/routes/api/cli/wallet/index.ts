import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { scryptSync, createDecipheriv } from "node:crypto";
import { db, walletSessions, wallets } from "#/db/server.ts";

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

function decryptSecretKey(encryptedHex: string, saltHex: string, ivHex: string): string {
  const data = Buffer.from(encryptedHex, "hex");
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const key = scryptSync(encryptedHex, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
