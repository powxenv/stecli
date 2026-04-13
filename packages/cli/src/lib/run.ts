import { Effect, Layer } from "effect";
import { makeOutputLayer } from "#/services/output.js";
import type { OutputFormat } from "#/services/output.js";
import { AppLive } from "#/layers/app-layer.js";
import { writeAuditEntry } from "#/lib/audit.js";

export async function runApp<A, E, R>(
  program: Effect.Effect<A, E, R>,
  command?: string,
  format: OutputFormat = "json",
): Promise<A> {
  const start = Date.now();
  const outputLayer = makeOutputLayer(format);
  const fullLayer = Layer.merge(outputLayer, AppLive);
  const provided = Effect.provide(program, fullLayer) as Effect.Effect<A, E, never>;
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
