import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import { printResult, formatHorizonError, type OutputFormat } from "#/services/output.js";
import { getAssets } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { limitSchema } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const assetsSearch = defineCommand({
  meta: { name: "search", description: "Search for assets on Stellar" },
  args: {
    network: networkArg,
    format: formatArg,
    code: { type: "string", alias: ["c"], description: "Filter by asset code (e.g. USDC)" },
    issuer: { type: "string", alias: ["i"], description: "Filter by asset issuer (G...)" },
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max records to return (default: 10)",
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

    const validation = Result.try({
      try: () => limitSchema.parse(String(args.limit ?? "10")),
      catch: (e: unknown) => e,
    });
    if (Result.isError(validation)) {
      const msg =
        validation.error instanceof z.ZodError
          ? formatZodError(validation.error)
          : validation.error instanceof Error
            ? validation.error.message
            : String(validation.error);
      printResult(Result.err(msg), format);
      return;
    }

    await runCommand(async () => {
      const assetsResult = await getAssets(network, {
        limit: Number(args.limit) || 10,
        code: args.code != null ? String(args.code) : undefined,
        issuer: args.issuer != null ? String(args.issuer) : undefined,
      });
      if (Result.isError(assetsResult)) return Result.err(formatHorizonError(assetsResult.error));

      return Result.ok({ count: assetsResult.value.length, assets: assetsResult.value });
    }, format);
  },
});
