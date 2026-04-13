import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import { printResult, formatHorizonError, type OutputFormat } from "#/services/output.js";
import { getFeeStats } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";

export const feeCommand = defineCommand({
  meta: { name: "fee", description: "Show current fee statistics from Horizon" },
  args: { network: networkArg, format: formatArg },
  async run({ args }) {
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network = networkResult.value;

    await runCommand(async () => {
      const feesResult = await getFeeStats(network);
      if (Result.isError(feesResult)) return Result.err(formatHorizonError(feesResult.error));
      return Result.ok(feesResult.value);
    }, format);
  },
});
