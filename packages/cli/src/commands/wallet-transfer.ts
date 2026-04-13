import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import {
  printResult,
  formatWalletError,
  formatStellarError,
  type OutputFormat,
} from "#/services/output.js";
import { fetchWallet } from "#/services/wallet-client.js";
import { transferXlm } from "#/services/stellar.js";
import { formatArg, parseFormat } from "#/lib/args.js";
import { stellarPublicKey, amountSchema } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const walletTransfer = defineCommand({
  meta: { name: "transfer", description: "Send XLM to another address" },
  args: {
    to: {
      type: "string",
      description: "Destination public key (G...)",
      required: true,
      alias: ["t"],
    },
    amount: {
      type: "string",
      description: "Amount in XLM",
      required: true,
      alias: ["a"],
    },
    format: formatArg,
  },
  async run({ args }) {
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    const to = String(args.to ?? "");
    const amount = String(args.amount ?? "");

    const validation = Result.try({
      try: () => {
        stellarPublicKey.parse(to);
        amountSchema.parse(amount);
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
      const walletResult = await fetchWallet();
      if (Result.isError(walletResult)) return Result.err(formatWalletError(walletResult.error));

      const result = await transferXlm(
        walletResult.value.secretKey,
        to,
        amount,
        walletResult.value.network,
      );
      if (Result.isError(result)) return Result.err(formatStellarError(result.error));

      return Result.ok(result.value);
    }, format);
  },
});
