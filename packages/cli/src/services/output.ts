import pc from "picocolors";
import { Result, matchErrorPartial } from "better-result";
import type {
  HorizonQueryError,
  PaymentError,
  SessionError,
  StellarError,
  WalletError,
} from "#/domain/types.js";

export type OutputFormat = "json" | "text";

export function printResult<T>(result: Result<T, string>, format: OutputFormat): void {
  if (format === "json") {
    console.log(
      JSON.stringify(
        Result.isOk(result) ? { ok: true, data: result.value } : { ok: false, error: result.error },
        null,
        2,
      ),
    );
    return;
  }
  if (Result.isOk(result)) {
    printText(result.value);
  } else {
    console.error(pc.red(`Error: ${result.error}`));
  }
}

export function printData<T>(data: T, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify({ ok: true, data }, null, 2));
    return;
  }
  printText(data);
}

export function formatSessionError(err: SessionError): string {
  return matchErrorPartial(
    err,
    {
      SessionNotFoundError: () => "No active session.",
      SessionReadError: (e) => `Failed to read session: ${e.cause}`,
      SessionWriteError: (e) => `Failed to save session: ${e.cause}`,
    },
    () => String(err),
  );
}

export function formatWalletError(err: WalletError): string {
  return matchErrorPartial(
    err,
    {
      WalletNotFoundError: () => "No wallet found. Run `stelagent wallet login` first.",
      WalletFetchError: (e) => `Failed to fetch wallet: ${e.cause}`,
      WalletCreateError: (e) => `Failed to create wallet: ${e.cause}`,
    },
    () => String(err),
  );
}

export function formatStellarError(err: StellarError): string {
  return matchErrorPartial(
    err,
    {
      StellarAccountError: (e) => `Failed to load account: ${e.cause}`,
      StellarTransactionError: (e) => `Transaction failed: ${e.cause}`,
      UnfundedAccountError: (e) =>
        `Account ${e.address.slice(0, 8)}... is not funded. Send at least 1 XLM to activate it.`,
      InsufficientBalanceError: (e) =>
        `Insufficient balance. Need ${e.required} ${e.asset} but have ${e.available}.`,
      NetworkTimeoutError: (e) =>
        `Network error: Could not reach Horizon. Check your connection. (${e.cause})`,
    },
    () => String(err),
  );
}

export function formatPaymentError(err: PaymentError): string {
  return matchErrorPartial(
    err,
    {
      PaymentHttpError: (e) => `Payment failed. Status: ${e.status}. Settle: ${e.settle ?? "none"}`,
      PaymentSetupError: (e) => `Payment setup failed: ${e.cause}`,
    },
    () => String(err),
  );
}

export function formatHorizonError(err: HorizonQueryError): string {
  return matchErrorPartial(
    err,
    {
      HorizonError: (e) => `Failed to fetch data from Horizon: ${e.cause}`,
      UnfundedAccountError: (e) =>
        `Account ${e.address.slice(0, 8)}... is not funded. Send at least 1 XLM to activate it.`,
      NetworkTimeoutError: (e) =>
        `Network error: Could not reach Horizon. Check your connection. (${e.cause})`,
    },
    () => String(err),
  );
}

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
      console.log(formatTable(data));
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
          console.log(formatTable(value));
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
    return value;
  }
  return JSON.stringify(value);
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function formatTable(rows: ReadonlyArray<Record<string, unknown>>): string {
  if (rows.length === 0) return "";

  const keys = Object.keys(rows[0]);
  const colWidths = keys.map((key) => {
    const headerLen = key.length;
    const maxDataLen = Math.max(...rows.map((row) => stringifyCell(row[key]).length));
    return Math.min(Math.max(headerLen, maxDataLen) + 2, 40);
  });

  const header = keys.map((key, i) => pc.bold(pc.cyan(key.padEnd(colWidths[i])))).join("");
  const separator = keys.map((_, i) => "─".repeat(colWidths[i])).join("─");
  const dataLines = rows.map((row) =>
    keys
      .map((key, i) =>
        stringifyCell(row[key])
          .slice(0, colWidths[i] - 1)
          .padEnd(colWidths[i]),
      )
      .join(""),
  );

  return [header, separator, ...dataLines].join("\n");
}
