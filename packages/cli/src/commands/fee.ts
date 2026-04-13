import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";

export const feeCommand = defineCommand({
  meta: { name: "fee", description: "Show current fee statistics from Horizon" },
  args: {
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
  },
  async run({ args }) {
    const network = args.network as "testnet" | "pubnet";
    if (network !== "testnet" && network !== "pubnet") {
      console.log(
        JSON.stringify(
          { ok: false, error: "Invalid network. Must be 'testnet' or 'pubnet'." },
          null,
          2,
        ),
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
    await runApp(program, "fee");
  },
});
