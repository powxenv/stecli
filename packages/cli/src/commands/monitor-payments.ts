import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { HorizonService } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey } from "#/domain/validators.js";
import type { Network } from "#/domain/types.js";

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
    let network: Network;
    let format: "json" | "text";
    try {
      network = parseNetwork(args.network as string);
      format = parseFormat(args.format as string);
      stellarPublicKey.parse(args.address as string);
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

    const cursor = args.cursor === "now" ? undefined : (args.cursor as string | undefined);

    const close = await runApp(
      Effect.gen(function* () {
        const horizon = yield* HorizonService;
        return yield* horizon.streamPayments(
          args.address as string,
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
      }),
      "monitor payments",
      format,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          data: {
            message: `Streaming payments for ${args.address} on ${network}... Press Ctrl+C to stop.`,
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
