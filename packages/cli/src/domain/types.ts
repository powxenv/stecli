import type { Result } from "better-result";
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
  HorizonError,
  UnfundedAccountError,
  InsufficientBalanceError,
  NetworkTimeoutError,
} from "./errors.js";

export type Network = "testnet" | "pubnet";

export type AuthError = AuthRequestError | OtpVerifyError;
export type SessionError = SessionNotFoundError | SessionReadError | SessionWriteError;
export type WalletError = WalletNotFoundError | WalletFetchError | WalletCreateError;
export type StellarError =
  | StellarAccountError
  | StellarTransactionError
  | UnfundedAccountError
  | InsufficientBalanceError
  | NetworkTimeoutError;
export type PaymentError = PaymentHttpError | PaymentSetupError;
export type HorizonQueryError = HorizonError | UnfundedAccountError | NetworkTimeoutError;

export type AuthResult<T> = Result<T, AuthError>;
export type SessionResult<T> = Result<T, SessionError>;
export type WalletResult<T> = Result<T, WalletError>;
export type StellarResult<T> = Result<T, StellarError>;
export type PaymentResultType<T> = Result<T, PaymentError>;
export type HorizonResult<T> = Result<T, HorizonQueryError>;

export interface BalanceEntry {
  readonly assetType: string;
  readonly assetCode: string;
  readonly balance: string;
}

export interface TransferResult {
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly asset: string;
  readonly txHash: string;
}

export interface WalletInfo {
  readonly email: string;
  readonly publicKey: string;
  readonly network: Network;
  readonly secretKey: string;
  readonly createdAt: string;
}

export interface SessionData {
  readonly token: string;
  readonly email: string;
}

export interface OtpResponse {
  readonly ok: boolean;
  readonly message: string;
}

export interface VerifyResponse {
  readonly ok: boolean;
  readonly verified: boolean;
  readonly token: string;
  readonly email: string;
}

export interface PaymentResult {
  readonly url: string;
  readonly status: number;
  readonly paymentRequired: boolean;
  readonly settlement?: unknown;
  readonly bodyPreview?: string;
}

export interface PaginationOpts {
  readonly cursor?: string;
  readonly limit?: number;
  readonly order?: "asc" | "desc";
}

export interface AccountDetails {
  readonly id: string;
  readonly accountId: string;
  readonly sequence: string;
  readonly subentryCount: number;
  readonly thresholds: { readonly low: number; readonly med: number; readonly high: number };
  readonly balances: ReadonlyArray<{
    readonly balance: string;
    readonly assetType: string;
    readonly assetCode?: string;
    readonly assetIssuer?: string;
    readonly limit?: string;
    readonly buyingLiabilities?: string;
    readonly sellingLiabilities?: string;
  }>;
  readonly signers: ReadonlyArray<{
    readonly key: string;
    readonly weight: number;
    readonly type: string;
  }>;
  readonly flags: {
    readonly authRequired: boolean;
    readonly authRevocable: boolean;
    readonly authImmutable: boolean;
    readonly authClawbackEnabled: boolean;
  };
  readonly homeDomain?: string;
  readonly lastModifiedLedger: number;
  readonly lastModifiedTime: string;
}

export interface TransactionRecord {
  readonly id: string;
  readonly hash: string;
  readonly createdAt: string;
  readonly ledger: number;
  readonly sourceAccount: string;
  readonly sourceAccountSequence: string;
  readonly feeCharged: number | string;
  readonly maxFee: number | string;
  readonly operationCount: number;
  readonly successful: boolean;
  readonly memoType: string;
  readonly memo?: string;
}

export interface PaymentOperationRecord {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly assetType: string;
  readonly assetCode?: string;
  readonly assetIssuer?: string;
  readonly transactionHash: string;
  readonly createdAt: string;
}

export interface EffectRecord {
  readonly id: string;
  readonly account: string;
  readonly type: string;
  readonly createdAt: string;
}

export interface AssetRecord {
  readonly assetType: string;
  readonly assetCode: string;
  readonly assetIssuer: string;
  readonly amount: string;
  readonly numAccounts: number;
}

export interface OrderbookRecord {
  readonly selling: {
    readonly assetType: string;
    readonly assetCode?: string;
    readonly assetIssuer?: string;
  };
  readonly buying: {
    readonly assetType: string;
    readonly assetCode?: string;
    readonly assetIssuer?: string;
  };
  readonly bids: ReadonlyArray<{ readonly price: string; readonly amount: string }>;
  readonly asks: ReadonlyArray<{ readonly price: string; readonly amount: string }>;
}

export interface FeeStats {
  readonly feeCharged: {
    readonly min: string;
    readonly max: string;
    readonly mode: string;
    readonly p10: string;
    readonly p20: string;
    readonly p30: string;
    readonly p40: string;
    readonly p50: string;
    readonly p60: string;
    readonly p70: string;
    readonly p80: string;
    readonly p90: string;
    readonly p95: string;
    readonly p99: string;
  };
  readonly maxFee: {
    readonly min: string;
    readonly max: string;
    readonly mode: string;
    readonly p10: string;
    readonly p20: string;
    readonly p30: string;
    readonly p40: string;
    readonly p50: string;
    readonly p60: string;
    readonly p70: string;
    readonly p80: string;
    readonly p90: string;
    readonly p95: string;
    readonly p99: string;
  };
  readonly ledgerCapacity: string;
}

export interface SendResult {
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly asset: string;
  readonly memo?: string;
  readonly txHash: string;
  readonly ledger: number;
}

export interface TradeAggregationOpts extends PaginationOpts {
  readonly baseAssetType: string;
  readonly baseAssetCode?: string;
  readonly baseAssetIssuer?: string;
  readonly counterAssetType: string;
  readonly counterAssetCode?: string;
  readonly counterAssetIssuer?: string;
  readonly resolution: number;
  readonly offset?: number;
  readonly startTime?: number;
  readonly endTime?: number;
}

export interface CandleRecord {
  readonly timestamp: string;
  readonly tradeCount: number;
  readonly baseVolume: string;
  readonly counterVolume: string;
  readonly avg: string;
  readonly high: string;
  readonly low: string;
  readonly open: string;
  readonly close: string;
}

export interface PreflightBalance {
  readonly asset: string;
  readonly available: string;
  readonly needed: string;
  readonly sufficient: boolean;
}

export interface PreflightCheck {
  readonly canProceed: boolean;
  readonly sender: string;
  readonly destination: string;
  readonly amount: string;
  readonly asset: string;
  readonly network: Network;
  readonly senderFunded: boolean;
  readonly destinationFunded: boolean;
  readonly destinationFundingRequired: boolean;
  readonly balances: ReadonlyArray<PreflightBalance>;
  readonly estimatedFee: string;
  readonly baseReserve: string;
  readonly warnings: ReadonlyArray<string>;
}

export interface StreamEvent<T> {
  readonly type: "message" | "error";
  readonly data: T;
}
