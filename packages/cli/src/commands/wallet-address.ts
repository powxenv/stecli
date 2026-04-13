import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import { formatWalletError, type OutputFormat } from "#/services/output.js";
import { fetchAddress } from "#/services/wallet-client.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletAddress = defineCommand({
  meta: { name: "address", description: "Show wallet public address" },
  args: { format: formatArg },
  async run({ args }) {
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    await runCommand(async () => {
      const addressResult = await fetchAddress();
      if (Result.isError(addressResult)) return Result.err(formatWalletError(addressResult.error));
      const address = addressResult.value;
      return Result.ok({
        publicKey: address.publicKey,
        network: address.network,
        email: address.email,
      });
    }, format);
  },
});
