import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";

export const walletAddress = defineCommand({
  meta: { name: "address", description: "Show wallet public address" },
  args: {},
  async run() {
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const wallet = yield* walletClient.fetchWallet();
      yield* output.print(
        output.ok({
          publicKey: wallet.publicKey,
          network: wallet.network,
          email: wallet.email,
        }),
      );
    }).pipe(
      Effect.catchTag("WalletNotFoundError", () =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err("No wallet found. Run `stecli wallet login` first."));
        }),
      ),
      Effect.catchTag("WalletFetchError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch wallet: ${e.cause}`));
        }),
      ),
    );

    await runApp(program, "wallet address");
  },
});
