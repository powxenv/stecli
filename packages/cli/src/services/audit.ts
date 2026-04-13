import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Context, Effect, Layer } from "effect";
import { AuditError } from "#/domain/errors.js";

const STECLI_DIR = join(homedir(), ".stecli");
const AUDIT_FILE = join(STECLI_DIR, "audit.jsonl");
const MAX_LINES = 10000;
const KEEP_LINES = 5000;

export class AuditService extends Context.Tag("AuditService")<
  AuditService,
  {
    readonly log: (entry: {
      readonly command: string;
      readonly ok: boolean;
      readonly durationMs: number;
      readonly args?: ReadonlyArray<string>;
    }) => Effect.Effect<void, AuditError>;
  }
>() {}

const SENSITIVE_FLAGS = new Set(["--secret", "--wallet", "--email", "--otp", "--signed-tx"]);

function redactArgs(args: ReadonlyArray<string>): ReadonlyArray<string> {
  const redacted: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (SENSITIVE_FLAGS.has(args[i])) {
      redacted.push(args[i], "[REDACTED]");
      i++;
    } else {
      redacted.push(args[i]);
    }
  }
  return redacted;
}

function rotateIfNeeded(): void {
  if (!existsSync(AUDIT_FILE)) return;
  const content = readFileSync(AUDIT_FILE, "utf8");
  const lines = content.split("\n").filter((l: string) => l.trim().length > 0);
  if (lines.length < MAX_LINES) return;
  const kept = lines.slice(-KEEP_LINES);
  writeFileSync(AUDIT_FILE, kept.join("\n") + "\n", { mode: 0o600 });
}

export const AuditLive = Layer.succeed(AuditService, {
  log: (entry) =>
    Effect.try({
      try: () => {
        if (!existsSync(STECLI_DIR)) mkdirSync(STECLI_DIR, { recursive: true });
        rotateIfNeeded();
        const line = JSON.stringify({
          ts: new Date().toISOString(),
          source: "cli",
          command: entry.command,
          ok: entry.ok,
          duration_ms: entry.durationMs,
          args: entry.args ? redactArgs(entry.args) : undefined,
        });
        writeFileSync(AUDIT_FILE, line + "\n", { mode: 0o600, flag: "a" });
      },
      catch: (e: unknown) => new AuditError({ cause: e instanceof Error ? e.message : String(e) }),
    }),
});
