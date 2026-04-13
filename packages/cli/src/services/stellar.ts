import { Context, Effect, Layer } from "effect";
import { StellarAccountError, StellarTransactionError } from "#/domain/errors.js";
import type { BalanceEntry, TransferResult, SendResult, Network } from "#/domain/types.js";

const HORIZON_URLS: Record<Network, string> = {
  testnet: process.env.STECLI_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
  pubnet: process.env.STECLI_HORIZON_PUBNET_URL ?? "https://horizon-mainnet.stellar.org",
};

export class StellarService extends Context.Tag("StellarService")<
  StellarService,
  {
    readonly getBalances: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<ReadonlyArray<BalanceEntry>, StellarAccountError>;
    readonly transferXlm: (
      sourceSecret: string,
      destination: string,
      amount: string,
      network: Network,
    ) => Effect.Effect<TransferResult, StellarAccountError | StellarTransactionError>;
    readonly sendPayment: (
      sourceSecret: string,
      destination: string,
      amount: string,
      asset: string,
      network: Network,
      memo?: string,
    ) => Effect.Effect<SendResult, StellarAccountError | StellarTransactionError>;
  }
>() {}

async function buildAsset(assetStr: string) {
  const { Asset } = await import("@stellar/stellar-sdk");
  if (assetStr === "native" || assetStr === "XLM") return Asset.native();
  const parts = assetStr.split(":");
  if (parts.length !== 2)
    throw new Error(`Invalid asset format: "${assetStr}". Use "native" or "CODE:ISSUER".`);
  return new Asset(parts[0], parts[1]);
}

export const StellarLive = Layer.succeed(StellarService, {
  getBalances: (publicKey: string, network: Network) =>
    Effect.tryPromise({
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
      catch: (e: unknown) =>
        new StellarAccountError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  transferXlm: (sourceSecret: string, destination: string, amount: string, network: Network) =>
    Effect.tryPromise({
      try: async () => {
        const { Keypair, Networks, Asset, Operation, TransactionBuilder, Horizon } =
          await import("@stellar/stellar-sdk");
        const server = new Horizon.Server(HORIZON_URLS[network]);
        const sourceKp = Keypair.fromSecret(sourceSecret);
        const sourceAccount = await server.loadAccount(sourceKp.publicKey());
        const fee = await server.fetchBaseFee();
        const txBuilder = new TransactionBuilder(sourceAccount, {
          fee: fee.toString(),
          networkPassphrase: network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
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
      catch: (e: unknown) =>
        new StellarTransactionError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  sendPayment: (
    sourceSecret: string,
    destination: string,
    amount: string,
    assetStr: string,
    network: Network,
    memo?: string,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const { Keypair, Networks, Operation, TransactionBuilder, Horizon, Memo } =
          await import("@stellar/stellar-sdk");
        const server = new Horizon.Server(HORIZON_URLS[network]);
        const sourceKp = Keypair.fromSecret(sourceSecret);
        const sourceAccount = await server.loadAccount(sourceKp.publicKey());
        const fee = await server.fetchBaseFee();
        const paymentAsset = await buildAsset(assetStr);
        const txBuilder = new TransactionBuilder(sourceAccount, {
          fee: fee.toString(),
          networkPassphrase: network === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
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
      catch: (e: unknown) =>
        new StellarTransactionError({ cause: e instanceof Error ? e.message : String(e) }),
    }),
});
