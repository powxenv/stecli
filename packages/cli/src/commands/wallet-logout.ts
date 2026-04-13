import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import { formatSessionError, type OutputFormat } from "#/services/output.js";
import { loadSession, clearSession } from "#/services/session.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletLogout = defineCommand({
  meta: { name: "logout", description: "Clear local session" },
  args: { format: formatArg },
  async run({ args }) {
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    await runCommand(async () => {
      const sessionResult = loadSession();
      if (Result.isError(sessionResult)) {
        return Result.err(formatSessionError(sessionResult.error));
      }
      const data = sessionResult.value;

      const clearResult = clearSession();
      if (Result.isError(clearResult)) {
        return Result.err(formatSessionError(clearResult.error));
      }

      return Result.ok({ loggedOut: true, email: data.email });
    }, format);
  },
});
