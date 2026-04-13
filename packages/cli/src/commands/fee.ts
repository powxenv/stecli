import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";

export const feeCommand = defineCommand({
  meta: { name: "fee", description: "Show current fee statistics from Horizon" },
  args: {
    network: networkArg,
    format: formatArg,
  },
  async run({ args }) {
    let network: "testnet" | "pubnet";
    let format: "json" | "text";
    try {
      network = parseNetwork(args.network as string);
      format = parseFormat(args.format as string);
    } catch (e: unknown) {
      console.log(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      );
      return;
    }
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const horizon = yield* HorizonService;
      const fees = yield* horizon.getFeeStats(network);
      yield* output.print(output.ok(fees));
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch fee stats: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "fee", format);
  },
});
