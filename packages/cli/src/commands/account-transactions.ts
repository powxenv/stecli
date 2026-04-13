import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";

export const accountTransactions = defineCommand({
  meta: { name: "transactions", description: "List transactions for an account" },
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
    const network = args.network as "testnet" | "pubnet";
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
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const horizon = yield* HorizonService;
      const transactions = yield* horizon.getTransactions(args.address as string, network, {
        limit: Number(args.limit) || 10,
        cursor: args.cursor as string | undefined,
        order: (args.order as "asc" | "desc") || "desc",
      });
      yield* output.print(
        output.ok({ address: args.address as string, count: transactions.length, transactions }),
      );
    }).pipe(
      Effect.catchTag("HorizonError", (e) =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err(`Failed to fetch transactions: ${e.cause}`));
        }),
      ),
    );
    await runApp(program, "account transactions");
  },
});
