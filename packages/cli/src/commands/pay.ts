import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { PaymentService } from "#/services/payment.js";
import { formatArg, parseFormat } from "#/lib/args.js";
import { urlSchema } from "#/domain/validators.js";

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
    format: formatArg,
  },
  async run({ args }) {
    let format: "json" | "text";
    try {
      format = parseFormat(args.format as string);
      urlSchema.parse(args.url as string);
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

    await runApp(program, "pay", format);
  },
});
