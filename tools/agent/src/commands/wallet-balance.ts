import { defineCommand } from "citty";
import { Effect } from "effect";
import { AppLive } from "#/layers/app-layer.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";

export const walletBalance = defineCommand({
  meta: { name: "balance", description: "Show wallet balances" },
  args: {},
  async run() {
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const stellar = yield* StellarService;
      const wallet = yield* walletClient.fetchWallet();
      const balances = yield* stellar.getBalances(wallet.publicKey, wallet.network);
      yield* output.print(output.ok({ address: wallet.publicKey, email: wallet.email, balances }));
    }).pipe(
      Effect.catchTag("WalletNotFoundError", () =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(
            output.err("No wallet found. Run `@centsh/agent wallet login` first."),
          );
        }),
      ),
      Effect.catchTag("WalletFetchError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch wallet: ${e.cause}`));
        }),
      ),
      Effect.catchTag("StellarAccountError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to load account: ${e.cause}`));
        }),
      ),
    );

    await Effect.runPromise(program.pipe(Effect.provide(AppLive)));
  },
});
