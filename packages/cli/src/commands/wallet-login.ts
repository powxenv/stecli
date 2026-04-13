import { defineCommand } from "citty";
import { text, isCancel, cancel, log } from "@clack/prompts";
import pc from "picocolors";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { AuthService } from "#/services/auth.js";
import { SessionService } from "#/services/session.js";
import { WalletClientService } from "#/services/wallet-client.js";

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
    network: {
      type: "string",
      default: "testnet",
      alias: ["n"],
      description: "Stellar network (testnet or pubnet)",
    },
  },
  async run({ args }) {
    const email = args.email as string;
    const rawNetwork = (args.network ?? "testnet") as string;

    if (rawNetwork !== "testnet" && rawNetwork !== "pubnet") {
      console.log(
        JSON.stringify(
          { ok: false, error: "Invalid network. Must be 'testnet' or 'pubnet'." },
          null,
          2,
        ),
      );
      return;
    }

    const network = rawNetwork;

    log.message(pc.cyan(`Sending OTP to ${email}...`));

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

    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const auth = yield* AuthService;
      const session = yield* SessionService;
      const walletClient = yield* WalletClientService;

      const otpResponse = yield* auth.requestOtp(email);
      log.success(otpResponse.message);

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
        AuthRequestError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            log.warn(pc.yellow("Auth API unavailable. Please try again later."));
            yield* output.print(output.err("Could not reach auth server."));
          }),
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

    await runApp(program, "wallet login");
  },
});
