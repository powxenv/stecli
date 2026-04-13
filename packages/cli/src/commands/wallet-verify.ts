import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { AuthService } from "#/services/auth.js";
import { SessionService } from "#/services/session.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";

export const walletVerify = defineCommand({
  meta: {
    name: "verify",
    description: "Verify OTP and create or recover wallet",
  },
  args: {
    email: {
      type: "string",
      alias: ["e"],
      description: "Your email address",
      required: true,
    },
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
    const email = args.email as string;
    const otp = args.otp as string;
    let network: "testnet" | "pubnet";
    let format: "json" | "text";
    try {
      network = parseNetwork((args.network ?? "testnet") as string);
      format = parseFormat(args.format as string);
    } catch (e: unknown) {
      console.log(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      );
      return;
    }

    const program = Effect.gen(function* () {
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

      const wallet = yield* walletClient.createWallet(network);

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

    await runApp(program, "wallet verify", format);
  },
});
