import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import { printResult, formatHorizonError, type OutputFormat } from "#/services/output.js";
import { getEffects } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const accountEffects = defineCommand({
  meta: { name: "effects", description: "List effects for an account" },
  args: {
    address: { type: "positional", description: "Stellar public key (G...)", required: true },
    network: networkArg,
    format: formatArg,
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max records to return (default: 10)",
      default: "10",
    },
    cursor: { type: "string", alias: ["c"], description: "Pagination cursor" },
  },
  async run({ args }) {
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network = networkResult.value;
    const address = String(args.address ?? "");

    const validation = Result.try({
      try: () => stellarPublicKey.parse(address),
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
      const effectsResult = await getEffects(address, network, {
        limit: Number(args.limit) || 10,
        cursor: args.cursor != null ? String(args.cursor) : undefined,
      });
      if (Result.isError(effectsResult)) return Result.err(formatHorizonError(effectsResult.error));

      return Result.ok({
        address,
        count: effectsResult.value.length,
        effects: effectsResult.value,
      });
    }, format);
  },
});
