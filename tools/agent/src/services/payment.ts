import { Context, Effect, Layer } from "effect";
import { WalletClientService } from "#/services/wallet-client.js";
import {
  WalletNotFoundError,
  WalletFetchError,
  PaymentHttpError,
  PaymentSetupError,
} from "#/domain/errors.js";
import type { PaymentResult, Network } from "#/domain/types.js";

const RPC_URLS: Record<Network, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  pubnet: process.env.STELLAR_RPC_URL ?? "https://soroban.stellar.org",
};

export class PaymentService extends Context.Tag("PaymentService")<
  PaymentService,
  {
    readonly pay: (
      url: string,
    ) => Effect.Effect<
      PaymentResult,
      WalletNotFoundError | WalletFetchError | PaymentHttpError | PaymentSetupError
    >;
  }
>() {}

export const PaymentLive = Layer.effect(
  PaymentService,
  Effect.gen(function* () {
    const walletClient = yield* WalletClientService;

    return {
      pay: (url: string) =>
        Effect.gen(function* () {
          const wallet = yield* walletClient.fetchWallet();
          const network = wallet.network as Network;
          const stellarNetwork = `stellar:${network}` as const;

          const [{ createEd25519Signer }, { ExactStellarScheme }, { x402Client, x402HTTPClient }] =
            yield* Effect.all([
              Effect.tryPromise({
                try: () => import("@x402/stellar"),
                catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
              }),
              Effect.tryPromise({
                try: () => import("@x402/stellar/exact/client"),
                catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
              }),
              Effect.tryPromise({
                try: () => import("@x402/core/client"),
                catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
              }),
            ]);

          const signer = createEd25519Signer(wallet.secretKey, stellarNetwork);
          const rpcConfig = { url: RPC_URLS[network] };
          const scheme = new ExactStellarScheme(signer, rpcConfig);
          const client = new x402Client().register("stellar:*", scheme);
          const httpClient = new x402HTTPClient(client);

          const firstResponse = yield* Effect.tryPromise({
            try: () => fetch(url),
            catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
          });

          if (firstResponse.status !== 402) {
            const result: PaymentResult = {
              url,
              status: firstResponse.status,
              paymentRequired: false,
            };
            return result;
          }

          const paymentRequired = httpClient.getPaymentRequiredResponse((name: string) =>
            firstResponse.headers.get(name),
          );

          const paymentPayload = yield* Effect.tryPromise({
            try: () => httpClient.createPaymentPayload(paymentRequired),
            catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
          });

          const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

          const paidResponse = yield* Effect.tryPromise({
            try: () => fetch(url, { headers: paymentHeaders }),
            catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
          });

          if (!paidResponse.ok) {
            const settleHeader = paidResponse.headers.get("x-payment-settle");
            return yield* Effect.fail(
              new PaymentHttpError({ status: paidResponse.status, settle: settleHeader }),
            );
          }

          const settlement = httpClient.getPaymentSettleResponse((name: string) =>
            paidResponse.headers.get(name),
          );

          const body = yield* Effect.tryPromise({
            try: () => paidResponse.text(),
            catch: () => new PaymentSetupError({ cause: "Failed to read response body" }),
          });

          const result: PaymentResult = {
            url,
            status: paidResponse.status,
            paymentRequired: true,
            settlement,
            bodyPreview: body.slice(0, 500),
          };
          return result;
        }),
    };
  }),
);
