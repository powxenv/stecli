import { defineCommand } from "citty";
import { Result } from "better-result";
import { text, isCancel, cancel, log } from "@clack/prompts";
import pc from "picocolors";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import {
  printResult,
  printData,
  formatSessionError,
  formatWalletError,
} from "#/services/output.js";
import { requestOtp, verifyOtp } from "#/services/auth.js";
import { saveSession } from "#/services/session.js";
import { createWallet } from "#/services/wallet-client.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { emailSchema } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const walletLogin = defineCommand({
  meta: {
    name: "login",
    description: "Sign in with email to create or recover your wallet",
  },
  args: {
    email: {
      type: "string",
      alias: ["e"],
      description: "Your email address",
      required: true,
    },
    network: networkArg,
    format: formatArg,
  },
  async run({ args }) {
    const email = String(args.email ?? "");
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network = networkResult.value;

    const validation = Result.try({
      try: () => emailSchema.parse(email),
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

    log.message(pc.cyan(`Sending OTP to ${email}...`));

    const otpResponseResult = await requestOtp(email);
    if (Result.isError(otpResponseResult)) {
      const msg = `AuthRequestError: ${otpResponseResult.error.cause}`;
      printResult(Result.err(msg), format);
      return;
    }

    const otpResponse = otpResponseResult.value;
    if (!otpResponse || !otpResponse.ok) return;

    log.success(otpResponse.message);

    const otpInput = await text({
      message: `Enter the OTP sent to ${email}`,
      placeholder: "123456",
      validate: (value: string | undefined) => {
        if (!value || value.trim().length === 0) return "OTP is required";
      },
    });

    if (isCancel(otpInput)) {
      cancel("Login cancelled.");
      process.exit(0);
    }

    const otp = String(otpInput);

    await runApp(
      "wallet login verify",
      async () => {
        const verifyResult = await verifyOtp(email, otp);
        if (Result.isError(verifyResult)) {
          printResult(Result.err(`OTP verification failed: ${verifyResult.error.cause}`), format);
          return undefined;
        }

        const verifyResponse = verifyResult.value;
        if (!verifyResponse.verified) {
          printResult(Result.err("OTP verification failed."), format);
          return undefined;
        }

        const sessionResult = saveSession(verifyResponse.token, verifyResponse.email);
        if (Result.isError(sessionResult)) {
          printResult(Result.err(formatSessionError(sessionResult.error)), format);
          return undefined;
        }

        log.message(pc.cyan("Setting up your wallet..."));

        const walletResult = await createWallet(network);
        if (Result.isError(walletResult)) {
          printResult(Result.err(formatWalletError(walletResult.error)), format);
          return undefined;
        }

        const wallet = walletResult.value;
        log.success(
          pc.green(
            wallet.publicKey
              ? `Wallet ready: ${wallet.publicKey.slice(0, 8)}...`
              : "Wallet recovered!",
          ),
        );

        printData({ wallet }, format);
        return wallet;
      },
      format,
    );
  },
});
