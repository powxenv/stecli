import { defineCommand } from "citty";
import { Result } from "better-result";
import { runCommand } from "#/lib/run.js";
import {
  printResult,
  formatSessionError,
  formatWalletError,
  type OutputFormat,
} from "#/services/output.js";
import { verifyOtp } from "#/services/auth.js";
import { saveSession } from "#/services/session.js";
import { createWallet } from "#/services/wallet-client.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";

export const walletVerify = defineCommand({
  meta: { name: "verify", description: "Verify OTP and create or recover wallet" },
  args: {
    email: { type: "string", alias: ["e"], description: "Your email address", required: true },
    otp: {
      type: "string",
      alias: ["o"],
      description: "The OTP code sent to your email",
      required: true,
    },
    network: networkArg,
    format: formatArg,
  },
  async run({ args }) {
    const email = String(args.email ?? "");
    const otp = String(args.otp ?? "");
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network = networkResult.value;

    await runCommand(async () => {
      const verifyResult = await verifyOtp(email, otp);
      if (Result.isError(verifyResult)) {
        return Result.err(
          `OTP verification failed. Please try again. (${verifyResult.error.cause})`,
        );
      }
      const verifyResponse = verifyResult.value;
      if (!verifyResponse.verified) {
        return Result.err("OTP verification failed.");
      }

      const sessionResult = saveSession(verifyResponse.token, verifyResponse.email);
      if (Result.isError(sessionResult)) {
        return Result.err(formatSessionError(sessionResult.error));
      }

      const walletResult = await createWallet(network);
      if (Result.isError(walletResult)) {
        return Result.err(formatWalletError(walletResult.error));
      }

      return Result.ok({ wallet: walletResult.value });
    }, format);
  },
});
