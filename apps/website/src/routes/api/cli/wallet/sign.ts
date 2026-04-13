import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { Keypair } from "@stellar/stellar-base";
import { wallets } from "#/db/schema";
import { getDb } from "#/db/index.ts";
import { decryptSecretKey } from "#/lib/server/crypto.ts";
import { authenticate } from "#/lib/server/auth.ts";

export const Route = createFileRoute("/api/cli/wallet/sign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const email = await authenticate(request);
        if (!email) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as {
          transactionXdr?: string;
          network?: string;
          signatureExpirationLedger?: number;
        };

        if (!body.transactionXdr) {
          return Response.json({ ok: false, error: "transactionXdr is required" }, { status: 400 });
        }

        const db = getDb();

        const result = await db.select().from(wallets).where(eq(wallets.email, email)).limit(1);

        if (result.length === 0) {
          return Response.json({ ok: false, error: "No wallet found" }, { status: 404 });
        }

        const walletRecord = result[0];
        const secretKey = decryptSecretKey(
          walletRecord.encryptedSecretKey,
          walletRecord.salt,
          walletRecord.iv,
        );
        const keypair = Keypair.fromSecret(secretKey);

        const { Transaction, Networks } = await import("@stellar/stellar-sdk");

        let tx: InstanceType<typeof Transaction>;
        try {
          const networkPassphrase = body.network === "pubnet" ? Networks.PUBLIC : Networks.TESTNET;
          tx = new Transaction(body.transactionXdr, networkPassphrase);
        } catch {
          return Response.json({ ok: false, error: "Invalid transaction XDR" }, { status: 400 });
        }

        tx.sign(keypair);

        return Response.json({
          ok: true,
          signedTransactionXdr: tx.toXDR(),
          signerPublicKey: keypair.publicKey(),
        });
      },
    },
  },
});
