import { Context, Effect, Layer } from "effect";
import pc from "picocolors";
import type { CommandResult } from "#/domain/types.js";

export type OutputFormat = "json" | "text";

export class OutputService extends Context.Tag("OutputService")<
  OutputService,
  {
    readonly ok: <T>(data: T) => CommandResult<T>;
    readonly err: (error: string) => CommandResult<never>;
    readonly format: OutputFormat;
    readonly print: <T>(result: CommandResult<T>) => Effect.Effect<void>;
  }
>() {}

export function makeOutputLayer(format: OutputFormat): Layer.Layer<OutputService> {
  return Layer.succeed(OutputService, {
    ok: <T>(data: T): CommandResult<T> => ({ ok: true as const, data }),
    err: (error: string): CommandResult<never> => ({ ok: false as const, error }),
    format,
    print: <T>(result: CommandResult<T>): Effect.Effect<void> =>
      Effect.sync(() => {
        if (format === "json") {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        if (result.ok) {
          printText(result.data);
        } else {
          console.error(pc.red(`Error: ${result.error}`));
        }
      }),
  });
}

export const OutputLive = makeOutputLayer("json");

function printText(data: unknown): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string") {
    console.log(data);
    return;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log(pc.dim("(no results)"));
      return;
    }
    if (typeof data[0] === "object" && data[0] !== null) {
      console.log(formatTable(data as ReadonlyArray<Record<string, unknown>>));
      return;
    }
    data.forEach((item) => console.log(String(item)));
    return;
  }
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const entries = Object.entries(record);
    if (entries.length === 0) {
      console.log(pc.dim("(empty)"));
      return;
    }
    const isFlatObject = entries.every(([, v]) => typeof v !== "object" || v === null);
    if (isFlatObject) {
      for (const [key, value] of entries) {
        console.log(`  ${pc.cyan(key.padEnd(20))} ${formatValue(value)}`);
      }
      return;
    }
    for (const [key, value] of entries) {
      if (Array.isArray(value)) {
        console.log(`\n${pc.bold(key)} (${value.length})`);
        if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
          console.log(formatTable(value as ReadonlyArray<Record<string, unknown>>));
        } else {
          value.forEach((item) => console.log(`  ${formatValue(item)}`));
        }
      } else if (typeof value === "object" && value !== null) {
        console.log(`\n${pc.bold(key)}`);
        const sub = value as Record<string, unknown>;
        for (const [k, v] of Object.entries(sub)) {
          console.log(`  ${pc.cyan(k.padEnd(18))} ${formatValue(v)}`);
        }
      } else {
        console.log(`  ${pc.cyan(key.padEnd(20))} ${formatValue(value)}`);
      }
    }
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return pc.dim("—");
  if (typeof value === "boolean") return value ? pc.green("yes") : pc.red("no");
  if (typeof value === "number") return pc.yellow(String(value));
  if (typeof value === "string") {
    if (/^G[A-Z2-7]{55}$/.test(value))
      return pc.magenta(value.slice(0, 8) + "..." + value.slice(-4));
    return String(value);
  }
  return String(value);
}

function formatTable(rows: ReadonlyArray<Record<string, unknown>>): string {
  if (rows.length === 0) return "";

  const keys = Object.keys(rows[0]);
  const colWidths = keys.map((key) => {
    const headerLen = key.length;
    const maxDataLen = Math.max(...rows.map((row) => String(row[key] ?? "—").length));
    return Math.min(Math.max(headerLen, maxDataLen) + 2, 40);
  });

  const header = keys.map((key, i) => pc.bold(pc.cyan(key.padEnd(colWidths[i])))).join("");
  const separator = keys.map((_, i) => "─".repeat(colWidths[i])).join("─");
  const dataLines = rows.map((row) =>
    keys
      .map((key, i) =>
        String(row[key] ?? "—")
          .slice(0, colWidths[i] - 1)
          .padEnd(colWidths[i]),
      )
      .join(""),
  );

  return [header, separator, ...dataLines].join("\n");
}
