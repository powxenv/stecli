import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runCommand } from "#/lib/run.js";
import { printResult, formatPaymentError, type OutputFormat } from "#/services/output.js";
import { pay } from "#/services/payment.js";
import { formatArg, parseFormat } from "#/lib/args.js";
import { urlSchema } from "#/domain/validators.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const payCommand = defineCommand({
  meta: { name: "pay", description: "Make an x402 payment to a URL" },
  args: {
    url: { type: "positional", description: "URL to pay for", required: true },
    format: formatArg,
  },
  async run({ args }) {
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    const url = String(args.url ?? "");
    const validation = Result.try({
      try: () => urlSchema.parse(url),
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

    await runCommand(async () => {
      const result = await pay(url);
      if (Result.isError(result)) {
        return Result.err(formatPaymentError(result.error));
      }
      return Result.ok(result.value);
    }, format);
  },
});
