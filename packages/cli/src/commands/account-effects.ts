import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";

export const accountEffects = defineCommand({
  meta: { name: "effects", description: "List effects for an account" },
  args: {
    address: {
      type: "positional",
      description: "Stellar public key (G...)",
      required: true,
    },
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max records to return (default: 10)",
      default: "10",
    },
    cursor: {
      type: "string",
      alias: ["c"],
      description: "Pagination cursor",
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
      const effects = yield* horizon.getEffects(args.address as string, network, {
        limit: Number(args.limit) || 10,
        cursor: args.cursor as string | undefined,
      });
      yield* output.print(
        output.ok({ address: args.address as string, count: effects.length, effects }),
      );
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch effects: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "account effects");
  },
});
