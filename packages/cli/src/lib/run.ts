import { Result, isTaggedError, matchError } from "better-result";
import type {
  AuthRequestError,
  OtpVerifyError,
  SessionNotFoundError,
  SessionReadError,
  SessionWriteError,
  WalletNotFoundError,
  WalletFetchError,
  WalletCreateError,
  StellarAccountError,
  StellarTransactionError,
  PaymentHttpError,
  PaymentSetupError,
  InvalidNetworkError,
  HorizonError,
  AuditError,
  UnfundedAccountError,
  InsufficientBalanceError,
  NetworkTimeoutError,
} from "#/domain/errors.js";
import { writeAuditEntry } from "#/lib/audit.js";
import type { OutputFormat } from "#/services/output.js";
import { printResult } from "#/services/output.js";

type AppError =
  | AuthRequestError
  | OtpVerifyError
  | SessionNotFoundError
  | SessionReadError
  | SessionWriteError
  | WalletNotFoundError
  | WalletFetchError
  | WalletCreateError
  | StellarAccountError
  | StellarTransactionError
  | PaymentHttpError
  | PaymentSetupError
  | InvalidNetworkError
  | HorizonError
  | AuditError
  | UnfundedAccountError
  | InsufficientBalanceError
  | NetworkTimeoutError;

function formatError(e: unknown): string {
  if (isTaggedError(e)) {
    return matchError(e as AppError, {
      AuthRequestError: (err) => `AuthRequestError: ${err.cause}`,
      OtpVerifyError: (err) => `OtpVerifyError: ${err.cause}`,
      SessionNotFoundError: () => "SessionNotFoundError",
      SessionReadError: (err) => `SessionReadError: ${err.cause}`,
      SessionWriteError: (err) => `SessionWriteError: ${err.cause}`,
      WalletNotFoundError: () => "WalletNotFoundError",
      WalletFetchError: (err) => `WalletFetchError: ${err.cause}`,
      WalletCreateError: (err) => `WalletCreateError: ${err.cause}`,
      StellarAccountError: (err) => `StellarAccountError: ${err.cause}`,
      StellarTransactionError: (err) => `StellarTransactionError: ${err.cause}`,
      PaymentHttpError: (err) => `PaymentHttpError: status=${err.status}`,
      PaymentSetupError: (err) => `PaymentSetupError: ${err.cause}`,
      InvalidNetworkError: (err) => `InvalidNetworkError: ${err.provided}`,
      HorizonError: (err) => `HorizonError: ${err.cause}`,
      AuditError: (err) => `AuditError: ${err.cause}`,
      UnfundedAccountError: (err) => `UnfundedAccountError: ${err.address}`,
      InsufficientBalanceError: (err) =>
        `InsufficientBalanceError: need ${err.required} ${err.asset}, have ${err.available}`,
      NetworkTimeoutError: (err) => `NetworkTimeoutError: ${err.cause}`,
    });
  }
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

export async function runApp<A>(
  command: string,
  fn: () => Promise<A>,
  format: OutputFormat = "json",
): Promise<A> {
  const start = Date.now();
  try {
    const result = await fn();
    writeAuditEntry({ command, ok: true, durationMs: Date.now() - start });
    return result;
  } catch (e: unknown) {
    writeAuditEntry({ command, ok: false, durationMs: Date.now() - start });
    const message = formatError(e);
    printResult(Result.err(message), format);
    process.exit(1);
  }
}

export async function runCommand<A>(
  fn: () => Promise<Result<A, string>>,
  format: OutputFormat,
): Promise<void> {
  try {
    const result = await fn();
    printResult(result, format);
  } catch (e: unknown) {
    const message = formatError(e);
    printResult(Result.err(message), format);
  }
}
