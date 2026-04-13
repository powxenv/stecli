import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletBalance = defineCommand({
  meta: { name: "balance", description: "Show wallet balances" },
  args: {
    format: formatArg,
  },
  async run({ args }) {
    let format: "json" | "text";
    try {
      format = parseFormat(args.format as string);
    } catch (e: unknown) {
      console.log(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      );
      return;
    }
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const stellar = yield* StellarService;
      const wallet = yield* walletClient.fetchWallet();
      const balances = yield* stellar.getBalances(wallet.publicKey, wallet.network);
      yield* output.print(output.ok({ address: wallet.publicKey, email: wallet.email, balances }));
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
        UnfundedAccountError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Account ${e.address.slice(0, 8)}... is not funded. Send at least 1 XLM to activate it.`,
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

    await runApp(program, "wallet balance", format);
  },
});
