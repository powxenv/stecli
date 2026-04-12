export type Network = "testnet" | "pubnet";

export type CommandResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

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
  readonly flowId: string;
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
