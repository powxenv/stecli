import { Data } from "effect";

export class AuthRequestError extends Data.TaggedError("AuthRequestError")<{
  readonly cause: string;
}> {}

export class OtpVerifyError extends Data.TaggedError("OtpVerifyError")<{
  readonly cause: string;
}> {}

export class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError")<{}> {}

export class SessionReadError extends Data.TaggedError("SessionReadError")<{
  readonly cause: string;
}> {}

export class SessionWriteError extends Data.TaggedError("SessionWriteError")<{
  readonly cause: string;
}> {}

export class WalletNotFoundError extends Data.TaggedError("WalletNotFoundError")<{}> {}

export class WalletFetchError extends Data.TaggedError("WalletFetchError")<{
  readonly cause: string;
}> {}

export class WalletCreateError extends Data.TaggedError("WalletCreateError")<{
  readonly cause: string;
}> {}

export class StellarAccountError extends Data.TaggedError("StellarAccountError")<{
  readonly cause: string;
}> {}

export class StellarTransactionError extends Data.TaggedError("StellarTransactionError")<{
  readonly cause: string;
}> {}

export class PaymentHttpError extends Data.TaggedError("PaymentHttpError")<{
  readonly status: number;
  readonly settle: string | null;
}> {}

export class PaymentSetupError extends Data.TaggedError("PaymentSetupError")<{
  readonly cause: string;
}> {}

export class InvalidNetworkError extends Data.TaggedError("InvalidNetworkError")<{
  readonly provided: string;
}> {}

export class HorizonError extends Data.TaggedError("HorizonError")<{
  readonly cause: string;
}> {}

export class AuditError extends Data.TaggedError("AuditError")<{
  readonly cause: string;
}> {}
