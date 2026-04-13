import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { PaymentService } from "#/services/payment.js";

export const payCommand = defineCommand({
  meta: {
    name: "pay",
    description: "Make an x402 payment to a URL",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to pay for",
      required: true,
    },
  },
  async run({ args }) {
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const payment = yield* PaymentService;
      const result = yield* payment.pay(args.url as string);
      yield* output.print(output.ok(result));
    }).pipe(
      Effect.catchTags({
        WalletNotFoundError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("No wallet found. Run `stecli wallet login` first."));
          }),
        WalletFetchError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Failed to fetch wallet: ${e.cause}`));
          }),
        PaymentHttpError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(`Payment failed. Status: ${e.status}. Settle: ${e.settle ?? "none"}`),
            );
          }),
        PaymentSetupError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Payment setup failed: ${e.cause}`));
          }),
      }),
    );

    await runApp(program, "pay");
  },
});
