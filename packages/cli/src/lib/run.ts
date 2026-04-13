import { Effect } from "effect";
import { AppLive } from "#/layers/app-layer.js";
import { writeAuditEntry } from "#/lib/audit.js";

export async function runApp<A, E, R>(
  program: Effect.Effect<A, E, R>,
  command?: string,
): Promise<A> {
  const start = Date.now();
  const provided = Effect.provide(program, AppLive) as Effect.Effect<A, E, never>;
  try {
    const result = await Effect.runPromise(provided);
    if (command) {
      writeAuditEntry({ command, ok: true, durationMs: Date.now() - start });
    }
    return result;
  } catch (e) {
    if (command) {
      writeAuditEntry({ command, ok: false, durationMs: Date.now() - start });
    }
    throw e;
  }
}
