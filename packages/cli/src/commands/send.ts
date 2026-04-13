import { defineCommand } from "citty";
import { Result } from "better-result";
import { confirm, isCancel, cancel } from "@clack/prompts";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import {
  printResult,
  formatWalletError,
  formatStellarError,
  type OutputFormat,
} from "#/services/output.js";
import { fetchWallet } from "#/services/wallet-client.js";
import { sendPayment } from "#/services/stellar.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey, amountSchema, assetSchema, memoSchema } from "#/domain/validators.js";
import type { Network } from "#/domain/types.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const sendCommand = defineCommand({
  meta: { name: "send", description: "Send a payment to another Stellar address" },
  args: {
    destination: {
      type: "positional",
      description: "Destination public key (G...)",
      required: true,
    },
    amount: {
      type: "positional",
      description: "Amount to send",
      required: true,
    },
    asset: {
      type: "string",
      alias: ["a"],
      description: "Asset to send: 'native' (default) or 'CODE:ISSUER' for custom assets",
      default: "native",
    },
    memo: {
      type: "string",
      alias: ["m"],
      description: "Transaction memo (optional)",
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

    const network: Network = networkResult.value;

    const destination = String(args.destination ?? "");
    const amount = String(args.amount ?? "");
    const asset = String(args.asset ?? "native");
    const memo = args.memo != null ? String(args.memo) : undefined;

    const validation = Result.try({
      try: () => {
        stellarPublicKey.parse(destination);
        amountSchema.parse(amount);
        assetSchema.parse(asset);
        if (memo !== undefined) memoSchema.parse(memo);
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

    if (asset === "native" && Number.parseFloat(amount) > 100) {
      const shouldContinue = await confirm({
        message: `You are about to send ${amount} XLM. Continue?`,
      });
      if (isCancel(shouldContinue) || !shouldContinue) {
        cancel("Payment cancelled.");
        return;
      }
    }

    await runCommand(async () => {
      const walletResult = await fetchWallet();
      if (Result.isError(walletResult)) return Result.err(formatWalletError(walletResult.error));

      const result = await sendPayment(
        walletResult.value.secretKey,
        destination,
        amount,
        asset,
        network,
        memo,
      );
      if (Result.isError(result)) return Result.err(formatStellarError(result.error));

      return Result.ok(result.value);
    }, format);
  },
});
