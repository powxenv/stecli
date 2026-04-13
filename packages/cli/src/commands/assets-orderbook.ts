import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";

export const assetsOrderbook = defineCommand({
  meta: { name: "orderbook", description: "View orderbook for an asset pair" },
  args: {
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
    selling: {
      type: "string",
      alias: ["s"],
      description: "Selling asset. Use 'native' for XLM, or 'CODE:ISSUER' for custom assets",
      required: true,
    },
    buying: {
      type: "string",
      alias: ["b"],
      description: "Buying asset. Use 'native' for XLM, or 'CODE:ISSUER' for custom assets",
      required: true,
    },
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max order book levels (default: 10)",
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

    function parseAsset(input: string): {
      assetType: string;
      assetCode?: string;
      assetIssuer?: string;
    } {
      if (input === "native" || input === "XLM") return { assetType: "native" };
      const parts = input.split(":");
      if (parts.length !== 2)
        throw new Error(`Invalid asset format: "${input}". Use "native" or "CODE:ISSUER".`);
      return {
        assetType: parts[0].length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
        assetCode: parts[0],
        assetIssuer: parts[1],
      };
    }

    let sellingAsset: { assetType: string; assetCode?: string; assetIssuer?: string };
    let buyingAsset: { assetType: string; assetCode?: string; assetIssuer?: string };
    try {
      sellingAsset = parseAsset(args.selling as string);
      buyingAsset = parseAsset(args.buying as string);
    } catch (e: unknown) {
      console.log(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      );
      return;
    }

    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const horizon = yield* HorizonService;
      const orderbook = yield* horizon.getOrderbook(sellingAsset, buyingAsset, network, {
        limit: Number(args.limit) || 10,
      });
      yield* output.print(output.ok(orderbook));
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch orderbook: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "assets orderbook");
  },
});
