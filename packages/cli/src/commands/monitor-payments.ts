import { defineCommand } from "citty";
import { Result } from "better-result";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { printResult, type OutputFormat } from "#/services/output.js";
import { streamPayments } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey } from "#/domain/validators.js";
import type { Network } from "#/domain/types.js";

function formatZodError(e: z.ZodError): string {
  return e.issues.map((issue) => issue.message).join(", ");
}

export const monitorPayments = defineCommand({
  meta: { name: "payments", description: "Stream payments for an account in real-time" },
  args: {
    address: {
      type: "positional",
      description: "Stellar public key (G...)",
      required: true,
    },
    network: networkArg,
    format: formatArg,
    cursor: {
      type: "string",
      alias: ["c"],
      description: "Start from this cursor (default: 'now' for new events)",
      default: "now",
    },
  },
  async run({ args }) {
    const networkResult = parseNetwork(String(args.network ?? "testnet"));
    const format: OutputFormat = parseFormat(String(args.format ?? "json"));

    if (Result.isError(networkResult)) {
      printResult(Result.err(networkResult.error._tag), "json");
      return;
    }

    const network: Network = networkResult.value;
    const address = String(args.address ?? "");

    const validation = Result.try({
      try: () => stellarPublicKey.parse(address),
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

    const cursor = args.cursor === "now" ? undefined : String(args.cursor);

    let close: () => void;
    try {
      close = await runApp(
        "monitor payments",
        async () => {
          return streamPayments(
            address,
            network,
            { cursor },
            (record) => {
              console.log(JSON.stringify({ ok: true, data: record }));
            },
            (error) => {
              const message = error instanceof Error ? error.message : String(error);
              console.log(JSON.stringify({ ok: false, error: `Stream error: ${message}` }));
            },
          );
        },
        format,
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      printResult(Result.err(`Failed to stream payments: ${message}`), "json");
      return;
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          data: {
            message: `Streaming payments for ${address} on ${network}... Press Ctrl+C to stop.`,
          },
        },
        null,
        2,
      ),
    );

    await new Promise<void>((resolve) => {
      process.on("SIGINT", () => {
        close();
        resolve();
      });
    });
  },
});
