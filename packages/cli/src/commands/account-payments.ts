import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey } from "#/domain/validators.js";

export const accountPayments = defineCommand({
  meta: { name: "payments", description: "List payments for an account" },
  args: {
    address: {
      type: "positional",
      description: "Stellar public key (G...)",
      required: true,
    },
    network: networkArg,
    format: formatArg,
    limit: {
      type: "string",
      alias: ["l"],
      description: "Max records to return (default: 10)",
      default: "10",
    },
    cursor: {
      type: "string",
      alias: ["c"],
      description: "Pagination cursor",
    },
    order: {
      type: "string",
      alias: ["o"],
      description: "Sort order: asc or desc (default: desc)",
      default: "desc",
    },
  },
  async run({ args }) {
    let network: "testnet" | "pubnet";
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
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const horizon = yield* HorizonService;
      const payments = yield* horizon.getPayments(args.address as string, network, {
        limit: Number(args.limit) || 10,
        cursor: args.cursor as string | undefined,
        order: (args.order as "asc" | "desc") || "desc",
      });
      yield* output.print(
        output.ok({ address: args.address as string, count: payments.length, payments }),
      );
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch payments: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "account payments", format);
  },
});
