import { TaggedError } from "better-result";

export const AuthRequestError = TaggedError("AuthRequestError")<{ cause: string }>();
export type AuthRequestError = InstanceType<typeof AuthRequestError>;

export const OtpVerifyError = TaggedError("OtpVerifyError")<{ cause: string }>();
export type OtpVerifyError = InstanceType<typeof OtpVerifyError>;

export const SessionNotFoundError = TaggedError("SessionNotFoundError")();
export type SessionNotFoundError = InstanceType<typeof SessionNotFoundError>;

export const SessionReadError = TaggedError("SessionReadError")<{ cause: string }>();
export type SessionReadError = InstanceType<typeof SessionReadError>;

export const SessionWriteError = TaggedError("SessionWriteError")<{ cause: string }>();
export type SessionWriteError = InstanceType<typeof SessionWriteError>;

export const WalletNotFoundError = TaggedError("WalletNotFoundError")();
export type WalletNotFoundError = InstanceType<typeof WalletNotFoundError>;

export const WalletFetchError = TaggedError("WalletFetchError")<{ cause: string }>();
export type WalletFetchError = InstanceType<typeof WalletFetchError>;

export const WalletCreateError = TaggedError("WalletCreateError")<{ cause: string }>();
export type WalletCreateError = InstanceType<typeof WalletCreateError>;

export const StellarAccountError = TaggedError("StellarAccountError")<{ cause: string }>();
export type StellarAccountError = InstanceType<typeof StellarAccountError>;

export const StellarTransactionError = TaggedError("StellarTransactionError")<{ cause: string }>();
export type StellarTransactionError = InstanceType<typeof StellarTransactionError>;

export const PaymentHttpError = TaggedError("PaymentHttpError")<{
  status: number;
  settle: string | null;
}>();
export type PaymentHttpError = InstanceType<typeof PaymentHttpError>;

export const PaymentSetupError = TaggedError("PaymentSetupError")<{ cause: string }>();
export type PaymentSetupError = InstanceType<typeof PaymentSetupError>;

export const InvalidNetworkError = TaggedError("InvalidNetworkError")<{ provided: string }>();
export type InvalidNetworkError = InstanceType<typeof InvalidNetworkError>;

export const HorizonError = TaggedError("HorizonError")<{ cause: string }>();
export type HorizonError = InstanceType<typeof HorizonError>;

export const AuditError = TaggedError("AuditError")<{ cause: string }>();
export type AuditError = InstanceType<typeof AuditError>;

export const UnfundedAccountError = TaggedError("UnfundedAccountError")<{ address: string }>();
export type UnfundedAccountError = InstanceType<typeof UnfundedAccountError>;

export const InsufficientBalanceError = TaggedError("InsufficientBalanceError")<{
  available: string;
  required: string;
  asset: string;
}>();
export type InsufficientBalanceError = InstanceType<typeof InsufficientBalanceError>;

export const NetworkTimeoutError = TaggedError("NetworkTimeoutError")<{ cause: string }>();
export type NetworkTimeoutError = InstanceType<typeof NetworkTimeoutError>;
