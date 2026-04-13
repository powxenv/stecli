import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { limitSchema } from "#/domain/validators.js";

export const assetsSearch = defineCommand({
  meta: { name: "search", description: "Search for assets on Stellar" },
  args: {
    network: networkArg,
    format: formatArg,
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
    let network: "testnet" | "pubnet";
    let format: "json" | "text";
    try {
      network = parseNetwork(args.network as string);
      format = parseFormat(args.format as string);
      limitSchema.parse(args.limit as string);
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
    await runApp(program, "assets search", format);
  },
});
