import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { HorizonService } from "#/services/horizon.js";
import type { Network } from "#/domain/types.js";

export const monitorEffects = defineCommand({
  meta: { name: "effects", description: "Stream effects for an account in real-time" },
  args: {
    address: {
      type: "positional",
      description: "Stellar public key (G...)",
      required: true,
    },
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
    cursor: {
      type: "string",
      alias: ["c"],
      description: "Start from this cursor (default: 'now' for new events)",
      default: "now",
    },
  },
  async run({ args }) {
    const network = args.network as Network;
    if (network !== "testnet" && network !== "pubnet") {
      console.log(
        JSON.stringify(
          { ok: false, error: "Invalid network. Must be 'testnet' or 'pubnet'." },
          null,
          2,
        ),
      );
      return;
    }

    const cursor = args.cursor === "now" ? undefined : (args.cursor as string | undefined);

    const close = await runApp(
      Effect.gen(function* () {
        const horizon = yield* HorizonService;
        return yield* horizon.streamEffects(
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
      "monitor effects",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          data: {
            message: `Streaming effects for ${args.address} on ${network}... Press Ctrl+C to stop.`,
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
