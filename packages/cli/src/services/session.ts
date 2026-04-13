import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Context, Effect, Layer } from "effect";
import { SessionNotFoundError, SessionReadError, SessionWriteError } from "#/domain/errors.js";
import type { SessionData } from "#/domain/types.js";

const STECLI_DIR = join(homedir(), ".stecli");
const SESSION_FILE = join(STECLI_DIR, "session.json");

export class SessionService extends Context.Tag("SessionService")<
  SessionService,
  {
    readonly save: (token: string, email: string) => Effect.Effect<void, SessionWriteError>;
    readonly load: () => Effect.Effect<SessionData, SessionReadError | SessionNotFoundError>;
    readonly clear: () => Effect.Effect<void, SessionWriteError>;
  }
>() {}

export const SessionLive = Layer.succeed(SessionService, {
  save: (token: string, email: string) =>
    Effect.try({
      try: () => {
        if (!existsSync(STECLI_DIR)) mkdirSync(STECLI_DIR, { recursive: true });
        writeFileSync(SESSION_FILE, JSON.stringify({ token, email }, null, 2), { mode: 0o600 });
      },
      catch: (e: unknown) => new SessionWriteError({ cause: String(e) }),
    }),

  load: () =>
    Effect.gen(function* () {
      const raw = yield* Effect.try({
        try: () => (existsSync(SESSION_FILE) ? readFileSync(SESSION_FILE, "utf8") : null),
        catch: (e: unknown) => new SessionReadError({ cause: String(e) }),
      });

      if (raw === null) {
        return yield* Effect.fail(new SessionNotFoundError());
      }

      return JSON.parse(raw) as SessionData;
    }),

  clear: () =>
    Effect.try({
      try: () => {
        if (existsSync(SESSION_FILE)) {
          writeFileSync(SESSION_FILE, "{}", { mode: 0o600 });
        }
      },
      catch: (e: unknown) => new SessionWriteError({ cause: String(e) }),
    }),
});
