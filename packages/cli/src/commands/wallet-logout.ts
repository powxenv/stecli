import { defineCommand } from "citty";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { SessionService } from "#/services/session.js";

export const walletLogout = defineCommand({
  meta: { name: "logout", description: "Clear local session" },
  args: {},
  async run() {
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

    await runApp(program, "wallet logout");
  },
});
