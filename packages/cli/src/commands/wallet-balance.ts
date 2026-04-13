import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import { formatWalletError, formatStellarError, type OutputFormat } from "#/services/output.js";
import { fetchWallet } from "#/services/wallet-client.js";
import { getBalances } from "#/services/stellar.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletBalance = defineCommand({
  meta: { name: "balance", description: "Show wallet balances" },
  args: { format: formatArg },
  async run({ args }) {
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    await runCommand(async () => {
      const walletResult = await fetchWallet();
      if (Result.isError(walletResult)) return Result.err(formatWalletError(walletResult.error));
      const wallet = walletResult.value;

      const balancesResult = await getBalances(wallet.publicKey, wallet.network);
      if (Result.isError(balancesResult))
        return Result.err(formatStellarError(balancesResult.error));

      return Result.ok({
        address: wallet.publicKey,
        email: wallet.email,
        balances: balancesResult.value,
      });
    }, format);
  },
});
