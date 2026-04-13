import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import { printResult, formatWalletError, type OutputFormat } from "#/services/output.js";
import { preflightSend } from "#/services/preflight.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey, amountSchema, assetSchema } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const preflightCommand = defineCommand({
  meta: {
    name: "preflight",
    description: "Validate a payment before sending: check balances, fees, and destination",
  },
  args: {
    destination: {
      type: "positional",
      description: "Destination public key (G...)",
      required: true,
    },
    amount: {
      type: "string",
      alias: ["a"],
      description: "Amount to validate",
      required: true,
    },
    asset: {
      type: "string",
      alias: ["s"],
      description: "Asset: 'native' (default) or 'CODE:ISSUER'",
      default: "native",
    },
    network: networkArg,
    format: formatArg,
  },
  async run({ args }) {
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const destination = String(args.destination ?? "");
    const amount = String(args.amount ?? "");
    const asset = String(args.asset ?? "native");

    const validation = Result.try({
      try: () => {
        stellarPublicKey.parse(destination);
        amountSchema.parse(amount);
        assetSchema.parse(asset);
      },
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
      const result = await preflightSend(destination, amount, asset, networkResult.value);
      if (Result.isError(result)) return Result.err(formatWalletError(result.error));
      return Result.ok(result.value);
    }, format);
  },
});
