import { defineCommand } from "citty";
import { Effect } from "effect";
import { AppLive } from "#/layers/app-layer.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";

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
  },
  async run({ args }) {
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
            yield* output.print(
              output.err("No wallet found. Run `@centsh/agent wallet login` first."),
            );
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
      }),
    );

    await Effect.runPromise(program.pipe(Effect.provide(AppLive)));
  },
});
