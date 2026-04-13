import { defineCommand } from "citty";
import { Effect } from "effect";
import { z } from "zod";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { HorizonService } from "#/services/horizon.js";
import { networkArg, formatArg, parseNetwork, parseFormat } from "#/lib/args.js";
import { stellarPublicKey } from "#/domain/validators.js";

export const accountDetails = defineCommand({
  meta: { name: "details", description: "Show account details from Horizon" },
  args: {
    address: {
      type: "positional",
      description: "Stellar public key (G...)",
      required: true,
    },
    network: networkArg,
    format: formatArg,
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
      const details = yield* horizon.getAccountDetails(args.address as string, network);
      yield* output.print(output.ok(details));
    }).pipe(
      Effect.catchTags({
        HorizonError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Failed to fetch account: ${e.cause}`));
          }),
        UnfundedAccountError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Account ${e.address.slice(0, 8)}... is not funded on ${network}. Send at least 1 XLM to this address to activate it.`,
              ),
            );
          }),
        NetworkTimeoutError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(
              output.err(
                `Network error: Could not reach Horizon. Check your internet connection and try again. (${e.cause})`,
              ),
            );
          }),
      }),
    );
    await runApp(program, "account details", format);
  },
});
