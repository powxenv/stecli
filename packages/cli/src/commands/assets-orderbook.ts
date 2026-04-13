import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import { printResult, formatHorizonError, type OutputFormat } from "#/services/output.js";
import { getOrderbook } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";

export const assetsOrderbook = defineCommand({
  meta: { name: "orderbook", description: "View orderbook for an asset pair" },
  args: {
    network: networkArg,
    format: formatArg,
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
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network = networkResult.value;

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

    const parseAssets = Result.try({
      try: () => ({
        selling: parseAsset(String(args.selling ?? "")),
        buying: parseAsset(String(args.buying ?? "")),
      }),
      catch: (e: unknown) => e,
    });
    if (Result.isError(parseAssets)) {
      const msg =
        parseAssets.error instanceof Error ? parseAssets.error.message : String(parseAssets.error);
      printResult(Result.err(msg), "json");
      return;
    }

    const { selling: sellingAsset, buying: buyingAsset } = parseAssets.value;

    await runCommand(async () => {
      const orderbookResult = await getOrderbook(sellingAsset, buyingAsset, network, {
        limit: Number(args.limit) || 10,
      });
      if (Result.isError(orderbookResult))
        return Result.err(formatHorizonError(orderbookResult.error));

      return Result.ok(orderbookResult.value);
    }, format);
  },
});
