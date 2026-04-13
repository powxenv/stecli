import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { SessionService } from "#/services/session.js";
import { formatArg, parseFormat } from "#/lib/args.js";

export const walletLogout = defineCommand({
  meta: { name: "logout", description: "Clear local session" },
  args: {
    format: formatArg,
  },
  async run({ args }) {
    let format: "json" | "text";
    try {
      format = parseFormat(args.format as string);
    } catch (e: unknown) {
      console.log(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      );
      return;
    }
    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const session = yield* SessionService;
      const data = yield* session.load();
      yield* session.clear();
      yield* output.print(output.ok({ loggedOut: true, email: data.email }));
    }).pipe(
      Effect.catchTag("SessionNotFoundError", () =>
        Effect.gen(function* () {
          const output = yield* OutputService;
          yield* output.print(output.err("No active session."));
        }),
      ),
    );

    await runApp(program, "wallet logout", format);
  },
});
