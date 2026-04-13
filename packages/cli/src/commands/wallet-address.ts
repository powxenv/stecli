import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletAddress = defineCommand({
  meta: { name: "address", description: "Show wallet public address" },
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
      const address = yield* walletClient.fetchAddress();
      yield* output.print(
        output.ok({
          publicKey: address.publicKey,
          network: address.network,
          email: address.email,
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

    await runApp(program, "wallet address", format);
  },
});
