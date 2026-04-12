import { defineCommand } from "citty";
import { Effect } from "effect";
import { AppLive } from "#/layers/app-layer.js";
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

    await Effect.runPromise(program.pipe(Effect.provide(AppLive)));
  },
});
