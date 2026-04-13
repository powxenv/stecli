import { defineCommand } from "citty";
import { text, isCancel, cancel, log } from "@clack/prompts";
import pc from "picocolors";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { AuthService } from "#/services/auth.js";
import { SessionService } from "#/services/session.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { emailSchema } from "#/domain/validators.js";

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
    const email = args.email as string;
    let network: "testnet" | "pubnet";
    let format: "json" | "text";
    try {
      network = parseNetwork((args.network ?? "testnet") as string);
      format = parseFormat(args.format as string);
      emailSchema.parse(email);
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        console.log(
          JSON.stringify(
            {
              ok: false,
              error: e.issues.map((err: { message: string }) => err.message).join(", "),
            },
            null,
            2,
          ),
        );
      } else {
        console.log(
          JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
        );
      }
      return;
    }

    log.message(pc.cyan(`Sending OTP to ${email}...`));

    const requestProgram = Effect.gen(function* () {
      const auth = yield* AuthService;
      return yield* auth.requestOtp(email);
    }).pipe(
      Effect.catchTags({
        AuthRequestError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            log.warn(pc.yellow("Auth API unavailable. Please try again later."));
            yield* output.print(output.err("Could not reach auth server."));
            return null;
          }),
      }),
    );

    const otpResponse = await runApp(requestProgram, "wallet login request", format);
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

    const otp = otpInput as string;

    const verifyAndCreateProgram = Effect.gen(function* () {
      const output = yield* OutputService;
      const auth = yield* AuthService;
      const session = yield* SessionService;
      const walletClient = yield* WalletClientService;

      const verifyResponse = yield* auth.verifyOtp(email, otp);
      if (!verifyResponse.verified) {
        yield* output.print(output.err("OTP verification failed."));
        return;
      }

      yield* session.save(verifyResponse.token, verifyResponse.email);

      log.message(pc.cyan("Setting up your wallet..."));

      const wallet = yield* walletClient.createWallet(network);

      log.success(
        pc.green(
          wallet.publicKey
            ? `Wallet ready: ${wallet.publicKey.slice(0, 8)}...`
            : "Wallet recovered!",
        ),
      );

      yield* output.print(output.ok({ wallet }));
    }).pipe(
      Effect.catchTags({
        OtpVerifyError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("OTP verification failed. Please try again."));
          }),
        SessionWriteError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Failed to save session: ${e.cause}`));
          }),
        WalletNotFoundError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("No session found. Please try again."));
          }),
        WalletCreateError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("Failed to create wallet. Please try again."));
          }),
      }),
    );

    await runApp(verifyAndCreateProgram, "wallet login verify", format);
  },
});
