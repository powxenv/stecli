import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Result } from "better-result";
import { sendPayment } from "#/services/stellar.js";
import { pay } from "#/services/payment.js";
import { preflightSend } from "#/services/preflight.js";
import { fetchWallet } from "#/services/wallet-client.js";
import { formatWalletError, formatStellarError, formatPaymentError } from "#/services/output.js";
import type { Network } from "#/domain/types.js";
import { stellarPublicKey, amountSchema, assetSchema, memoSchema } from "#/domain/validators.js";

function ok<T>(data: T) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ ok: true, data }, null, 2) }],
  };
}

function err(message: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ ok: false, error: message }, null, 2) },
    ],
  };
}

function parseNetwork(value: string): Network {
  return value === "pubnet" ? "pubnet" : "testnet";
}

export function registerPaymentTools(server: McpServer): void {
  server.registerTool(
    "send_payment",
    {
      description:
        "Send a payment (XLM or custom asset) from the logged-in wallet to another Stellar address. Requires an active session.",
      inputSchema: {
        destination: z.string().describe("Destination public key (G...)"),
        amount: z.string().describe("Amount to send (up to 7 decimal places)"),
        asset: z
          .string()
          .default("native")
          .describe("Asset: 'native' for XLM, or 'CODE:ISSUER' for custom assets"),
        memo: z.string().optional().describe("Transaction memo text (max 28 chars)"),
        network: z.enum(["testnet", "pubnet"]).default("testnet").describe("Stellar network"),
      },
    },
    async ({ destination, amount, asset, memo, network }) => {
      const destValidation = stellarPublicKey.safeParse(destination);
      if (!destValidation.success)
        return err(
          `Invalid destination: ${destValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      const amountValidation = amountSchema.safeParse(amount);
      if (!amountValidation.success)
        return err(
          `Invalid amount: ${amountValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      const assetValidation = assetSchema.safeParse(asset);
      if (!assetValidation.success)
        return err(
          `Invalid asset: ${assetValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      if (memo !== undefined) {
        const memoValidation = memoSchema.safeParse(memo);
        if (!memoValidation.success)
          return err(
            `Invalid memo: ${memoValidation.error.issues.map((i) => i.message).join(", ")}`,
          );
      }

      const walletResult = await fetchWallet();
      if (Result.isError(walletResult)) return err(formatWalletError(walletResult.error));

      const result = await sendPayment(
        walletResult.value.secretKey,
        destination,
        amount,
        asset,
        parseNetwork(network),
        memo,
      );
      if (Result.isError(result)) return err(formatStellarError(result.error));

      return ok(result.value);
    },
  );

  server.registerTool(
    "pay_url",
    {
      description:
        "Make an X402 micropayment to a URL. The CLI detects 402 responses, signs auth entries, and returns the paid content. Requires an active session.",
      inputSchema: {
        url: z.string().describe("URL that requires X402 payment"),
      },
    },
    async ({ url }) => {
      const result = await pay(url);
      if (Result.isError(result)) return err(formatPaymentError(result.error));
      return ok(result.value);
    },
  );

  server.registerTool(
    "preflight_check",
    {
      description:
        "Validate a payment before sending. Checks if the sender has sufficient balance, estimates fees, and verifies the destination account. Returns whether the transaction can proceed, along with detailed balance info and warnings.",
      inputSchema: {
        destination: z.string().describe("Destination public key (G...)"),
        amount: z.string().describe("Amount to validate (up to 7 decimal places)"),
        asset: z
          .string()
          .default("native")
          .describe("Asset: 'native' for XLM, or 'CODE:ISSUER' for custom assets"),
        network: z.enum(["testnet", "pubnet"]).default("testnet").describe("Stellar network"),
      },
    },
    async ({ destination, amount, asset, network }) => {
      const destValidation = stellarPublicKey.safeParse(destination);
      if (!destValidation.success)
        return err(
          `Invalid destination: ${destValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      const amountValidation = amountSchema.safeParse(amount);
      if (!amountValidation.success)
        return err(
          `Invalid amount: ${amountValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      const assetValidation = assetSchema.safeParse(asset);
      if (!assetValidation.success)
        return err(
          `Invalid asset: ${assetValidation.error.issues.map((i) => i.message).join(", ")}`,
        );

      const parsedNetwork: Network = network === "pubnet" ? "pubnet" : "testnet";

      const result = await preflightSend(destination, amount, asset, parsedNetwork);
      if (Result.isError(result)) return err(formatWalletError(result.error));

      return ok(result.value);
    },
  );
}
