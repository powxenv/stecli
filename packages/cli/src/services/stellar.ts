import { Result } from "better-result";
import {
  StellarAccountError,
  StellarTransactionError,
  UnfundedAccountError,
  InsufficientBalanceError,
  NetworkTimeoutError,
} from "#/domain/errors.js";
import type {
  BalanceEntry,
  TransferResult,
  SendResult,
  Network,
  StellarResult,
} from "#/domain/types.js";

const HORIZON_URLS: Record<Network, string> = {
  testnet: process.env.STECLI_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
  pubnet: process.env.STECLI_HORIZON_PUBNET_URL ?? "https://horizon-mainnet.stellar.org",
};

const NETWORK_PASSPHRASE: Record<Network, string> = {
  testnet: "Test SDF Network ; September 2015",
  pubnet: "Public Global Stellar Network ; September 2015",
};

type StellarError =
  | StellarAccountError
  | StellarTransactionError
  | UnfundedAccountError
  | InsufficientBalanceError
  | NetworkTimeoutError;

function classifyAccountError(
  e: unknown,
  address: string,
): StellarAccountError | UnfundedAccountError | NetworkTimeoutError {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("404") || message.includes("not found") || message.includes("Not Found")) {
    return new UnfundedAccountError({ address });
  }
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  ) {
    return new NetworkTimeoutError({ cause: message });
  }
  return new StellarAccountError({ cause: message });
}

function classifyTransactionError(e: unknown): StellarTransactionError | InsufficientBalanceError {
  const message = e instanceof Error ? e.message : String(e);
  if (
    message.includes("op_underfunded") ||
    message.includes("insufficient_balance") ||
    message.includes("reserve") ||
    message.includes("overies")
  ) {
    return new InsufficientBalanceError({ available: "0", required: "0", asset: "XLM" });
  }
  return new StellarTransactionError({ cause: message });
}

function isStellarError(e: unknown): e is StellarError {
  return (
    e instanceof StellarAccountError ||
    e instanceof StellarTransactionError ||
    e instanceof UnfundedAccountError ||
    e instanceof InsufficientBalanceError ||
    e instanceof NetworkTimeoutError
  );
}

function classifyOrPassthrough(e: unknown): StellarError {
  return isStellarError(e) ? e : classifyTransactionError(e);
}

async function buildAsset(assetStr: string) {
  const { Asset } = await import("@stellar/stellar-sdk");
  if (assetStr === "native" || assetStr === "XLM") return Asset.native();
  const parts = assetStr.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid asset format: "${assetStr}". Use "native" or "CODE:ISSUER".`);
  }
  return new Asset(parts[0], parts[1]);
}

export async function getBalances(
  publicKey: string,
  network: Network,
): Promise<StellarResult<ReadonlyArray<BalanceEntry>>> {
  return Result.tryPromise({
    try: async () => {
      const { Horizon } = await import("@stellar/stellar-sdk");
      const server = new Horizon.Server(HORIZON_URLS[network]);
      const account = await server.loadAccount(publicKey);
      return account.balances.map(
        (b): BalanceEntry => ({
          assetType: b.asset_type,
          assetCode:
            b.asset_type === "native"
              ? "XLM"
              : "asset_code" in b && typeof b.asset_code === "string"
                ? b.asset_code
                : "",
          balance: b.balance,
        }),
      );
    },
    catch: (e: unknown) => classifyAccountError(e, publicKey),
  });
}

export async function transferXlm(
  sourceSecret: string,
  destination: string,
  amount: string,
  network: Network,
): Promise<StellarResult<TransferResult>> {
  return Result.tryPromise({
    try: async () => {
      const { Keypair, Asset, Operation, TransactionBuilder, Horizon } =
        await import("@stellar/stellar-sdk");
      const server = new Horizon.Server(HORIZON_URLS[network]);
      const sourceKp = Keypair.fromSecret(sourceSecret);
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(sourceKp.publicKey());
      } catch (e: unknown) {
        throw classifyAccountError(e, sourceKp.publicKey());
      }
      const fee = await server.fetchBaseFee();
      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: NETWORK_PASSPHRASE[network],
      });
      txBuilder.addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount,
        }),
      );
      txBuilder.setTimeout(30);
      const tx = txBuilder.build();
      tx.sign(sourceKp);
      const resp = await server.submitTransaction(tx);
      return {
        from: sourceKp.publicKey(),
        to: destination,
        amount,
        asset: "XLM",
        txHash: resp.hash,
      } satisfies TransferResult;
    },
    catch: (e: unknown) => classifyOrPassthrough(e),
  });
}

export async function sendPayment(
  sourceSecret: string,
  destination: string,
  amount: string,
  assetStr: string,
  network: Network,
  memo?: string,
): Promise<StellarResult<SendResult>> {
  return Result.tryPromise({
    try: async () => {
      const { Keypair, Operation, TransactionBuilder, Horizon, Memo } =
        await import("@stellar/stellar-sdk");
      const server = new Horizon.Server(HORIZON_URLS[network]);
      const sourceKp = Keypair.fromSecret(sourceSecret);
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(sourceKp.publicKey());
      } catch (e: unknown) {
        throw classifyAccountError(e, sourceKp.publicKey());
      }
      const fee = await server.fetchBaseFee();
      const paymentAsset = await buildAsset(assetStr);
      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: NETWORK_PASSPHRASE[network],
      });
      txBuilder.addOperation(
        Operation.payment({
          destination,
          asset: paymentAsset,
          amount,
        }),
      );
      if (memo) {
        txBuilder.addMemo(Memo.text(memo));
      }
      txBuilder.setTimeout(30);
      const tx = txBuilder.build();
      tx.sign(sourceKp);
      const resp = await server.submitTransaction(tx);
      return {
        from: sourceKp.publicKey(),
        to: destination,
        amount,
        asset: assetStr === "native" ? "XLM" : assetStr,
        memo,
        txHash: resp.hash,
        ledger: resp.ledger,
      } satisfies SendResult;
    },
    catch: (e: unknown) => classifyOrPassthrough(e),
  });
}
