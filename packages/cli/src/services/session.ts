import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Result } from "better-result";
import { z } from "zod";
import { SessionNotFoundError, SessionReadError, SessionWriteError } from "#/domain/errors.js";
import type { SessionData, SessionResult } from "#/domain/types.js";

const STECLI_DIR = join(homedir(), ".stecli");
const SESSION_FILE = join(STECLI_DIR, "session.json");

const SessionDataSchema = z.object({
  token: z.string(),
  email: z.string(),
});

export function saveSession(token: string, email: string): SessionResult<void> {
  return Result.try({
    try: () => {
      if (!existsSync(STECLI_DIR)) mkdirSync(STECLI_DIR, { recursive: true });
      writeFileSync(SESSION_FILE, JSON.stringify({ token, email }, null, 2), { mode: 0o600 });
    },
    catch: (e: unknown) => new SessionWriteError({ cause: String(e) }),
  });
}

export function loadSession(): SessionResult<SessionData> {
  const fileResult = Result.try({
    try: () => (existsSync(SESSION_FILE) ? readFileSync(SESSION_FILE, "utf8") : null),
    catch: (e: unknown) => new SessionReadError({ cause: String(e) }),
  });
  if (Result.isError(fileResult)) return Result.err(fileResult.error);
  const raw = fileResult.value;
  if (raw === null) return Result.err(new SessionNotFoundError());
  return Result.try({
    try: () => SessionDataSchema.parse(JSON.parse(raw)),
    catch: (e: unknown) => new SessionReadError({ cause: String(e) }),
  });
}

export function clearSession(): SessionResult<void> {
  return Result.try({
    try: () => {
      if (existsSync(SESSION_FILE)) {
        writeFileSync(SESSION_FILE, "{}", { mode: 0o600 });
      }
    },
    catch: (e: unknown) => new SessionWriteError({ cause: String(e) }),
  });
}
