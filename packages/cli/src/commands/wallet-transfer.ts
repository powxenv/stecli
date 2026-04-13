import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";
import { formatArg, parseFormat } from "#/lib/args.js";
import { stellarPublicKey, amountSchema } from "#/domain/validators.js";

export const walletTransfer = defineCommand({
  meta: { name: "transfer", description: "Send XLM to another address" },
  args: {
    to: {
      type: "string",
      description: "Destination public key (G...)",
      required: true,
      alias: ["t"],
    },
    amount: {
      type: "string",
      description: "Amount in XLM",
      required: true,
      alias: ["a"],
    },
    format: formatArg,
  },
  async run({ args }) {
    let format: "json" | "text";
    try {
      format = parseFormat(args.format as string);
      stellarPublicKey.parse(args.to as string);
      amountSchema.parse(args.amount as string);
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
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const stellar = yield* StellarService;
      const wallet = yield* walletClient.fetchWallet();
      const result = yield* stellar.transferXlm(
        wallet.secretKey,
        args.to as string,
        args.amount as string,
        wallet.network,
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
            yield* output.print(output.err(`Failed to load account: ${e.cause}`));
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
                `Account ${e.address.slice(0, 8)}... is not funded. Send at least 1 XLM to activate it.`,
              ),
            );
          }),
        InsufficientBalanceError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Insufficient balance. Need ${e.required} ${e.asset} but have ${e.available}.`,
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

    await runApp(program, "wallet transfer", format);
  },
});
