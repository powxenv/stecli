import { Context, Effect, Layer } from "effect";
import type { CommandResult } from "#/domain/types.js";

export class OutputService extends Context.Tag("OutputService")<
  OutputService,
  {
    readonly ok: <T>(data: T) => CommandResult<T>;
    readonly err: (error: string) => CommandResult<never>;
    readonly print: <T>(result: CommandResult<T>) => Effect.Effect<void>;
  }
>() {}

export const OutputLive = Layer.succeed(OutputService, {
  ok: <T>(data: T): CommandResult<T> => ({ ok: true as const, data }),
  err: (error: string): CommandResult<never> => ({ ok: false as const, error }),
  print: <T>(result: CommandResult<T>): Effect.Effect<void> =>
    Effect.sync(() => console.log(JSON.stringify(result, null, 2))),
});
