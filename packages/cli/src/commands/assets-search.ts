import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";

export const assetsSearch = defineCommand({
  meta: { name: "search", description: "Search for assets on Stellar" },
  args: {
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
    code: {
      type: "string",
      alias: ["c"],
      description: "Filter by asset code (e.g. USDC)",
    },
    issuer: {
      type: "string",
      alias: ["i"],
      description: "Filter by asset issuer (G...)",
    },
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max records to return (default: 10)",
      default: "10",
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
      const assets = yield* horizon.getAssets(network, {
        limit: Number(args.limit) || 10,
        code: args.code as string | undefined,
        issuer: args.issuer as string | undefined,
      });
      yield* output.print(output.ok({ count: assets.length, assets }));
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to search assets: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "assets search");
  },
});
