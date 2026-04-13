import { defineCommand } from "citty";
import { confirm, isCancel, cancel } from "@clack/prompts";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey, amountSchema, assetSchema, memoSchema } from "#/domain/validators.js";
import type { Network } from "#/domain/types.js";

export const sendCommand = defineCommand({
  meta: { name: "send", description: "Send a payment to another Stellar address" },
  args: {
    destination: {
      type: "positional",
      description: "Destination public key (G...)",
      required: true,
    },
    amount: {
      type: "positional",
      description: "Amount to send",
      required: true,
    },
    asset: {
      type: "string",
      alias: ["a"],
      description: "Asset to send: 'native' (default) or 'CODE:ISSUER' for custom assets",
      default: "native",
    },
    memo: {
      type: "string",
      alias: ["m"],
      description: "Transaction memo (optional)",
    },
    network: networkArg,
    format: formatArg,
  },
  async run({ args }) {
    let network: Network;
    let format: "json" | "text";
    try {
      network = parseNetwork(args.network as string);
      format = parseFormat(args.format as string);
      stellarPublicKey.parse(args.destination as string);
      amountSchema.parse(args.amount as string);
      assetSchema.parse(args.asset as string);
      if (args.memo !== undefined) {
        memoSchema.parse(args.memo as string);
      }
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        console.log(
          JSON.stringify(
            {
              ok: false,
              error: e.issues.map((err: { message: string }) => err.message).join(", "),
            },
            null,
            2,
          ),
        );
      } else {
        console.log(
          JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
        );
      }
      return;
    }

    const asset = args.asset as string;
    const amount = args.amount as string;
    if (asset === "native" && Number.parseFloat(amount) > 100) {
      const shouldContinue = await confirm({
        message: `You are about to send ${amount} XLM. Continue?`,
      });
      if (isCancel(shouldContinue) || !shouldContinue) {
        cancel("Payment cancelled.");
        return;
      }
    }

    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const stellar = yield* StellarService;
      const wallet = yield* walletClient.fetchWallet();
      const result = yield* stellar.sendPayment(
        wallet.secretKey,
        args.destination as string,
        args.amount as string,
        args.asset as string,
        network,
        args.memo as string | undefined,
      );
      yield* output.print(output.ok(result));
    }).pipe(
      Effect.catchTags({
        WalletNotFoundError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("No wallet found. Run `stecli wallet login` first."));
          }),
        WalletFetchError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Failed to fetch wallet: ${e.cause}`));
          }),
        StellarAccountError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Account error: ${e.cause}`));
          }),
        StellarTransactionError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Transaction failed: ${e.cause}`));
          }),
        UnfundedAccountError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Source account ${e.address.slice(0, 8)}... is not funded on ${network}. Send at least 1 XLM to activate it.`,
              ),
            );
          }),
        InsufficientBalanceError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Insufficient balance. You need at least ${e.required} ${e.asset} but only have ${e.available}. Account may also need reserve balance.`,
              ),
            );
          }),
        NetworkTimeoutError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Network error: Could not reach Horizon. Check your connection. (${e.cause})`,
              ),
            );
          }),
      }),
    );
    await runApp(program, "send", format);
  },
});
