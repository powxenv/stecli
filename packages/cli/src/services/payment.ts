import { Result } from "better-result";
import { PaymentHttpError, PaymentSetupError } from "#/domain/errors.js";
import type { PaymentResult, Network, PaymentResultType } from "#/domain/types.js";
import { fetchWallet } from "#/services/wallet-client.js";

const RPC_URLS: Record<Network, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  pubnet: process.env.STELLAR_RPC_URL ?? "https://soroban.stellar.org",
};

export async function pay(url: string): Promise<PaymentResultType<PaymentResult>> {
  const walletResult = await fetchWallet();
  if (Result.isError(walletResult)) {
    return Result.err(new PaymentSetupError({ cause: `Wallet error: ${walletResult.error._tag}` }));
  }
  const wallet = walletResult.value;

  const network: Network =
    wallet.network === "testnet" || wallet.network === "pubnet" ? wallet.network : "testnet";
  const stellarNetwork = `stellar:${network}` as const;

  const modulesResult = await Result.tryPromise({
    try: () =>
      Promise.all([
        import("@x402/stellar"),
        import("@x402/stellar/exact/client"),
        import("@x402/core/client"),
      ]),
    catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
  });
  if (Result.isError(modulesResult)) return Result.err(modulesResult.error);
  const [stellarMod, exactMod, coreMod] = modulesResult.value;

  const signer = stellarMod.createEd25519Signer(wallet.secretKey, stellarNetwork);
  const rpcConfig = { url: RPC_URLS[network] };
  const scheme = new exactMod.ExactStellarScheme(signer, rpcConfig);
  const client = new coreMod.x402Client().register("stellar:*", scheme);
  const httpClient = new coreMod.x402HTTPClient(client);

  const firstResponseResult = await Result.tryPromise({
    try: () => fetch(url),
    catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
  });
  if (Result.isError(firstResponseResult)) return Result.err(firstResponseResult.error);
  const firstResponse = firstResponseResult.value;

  if (firstResponse.status !== 402) {
    return Result.ok({
      url,
      status: firstResponse.status,
      paymentRequired: false,
    });
  }

  const paymentRequired = httpClient.getPaymentRequiredResponse((name: string) =>
    firstResponse.headers.get(name),
  );

  const payloadResult = await Result.tryPromise({
    try: () => httpClient.createPaymentPayload(paymentRequired),
    catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
  });
  if (Result.isError(payloadResult)) return Result.err(payloadResult.error);
  const paymentPayload = payloadResult.value;

  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  const paidResponseResult = await Result.tryPromise({
    try: () => fetch(url, { headers: paymentHeaders }),
    catch: (e: unknown) => new PaymentSetupError({ cause: String(e) }),
  });
  if (Result.isError(paidResponseResult)) return Result.err(paidResponseResult.error);
  const paidResponse = paidResponseResult.value;

  if (!paidResponse.ok) {
    const settleHeader = paidResponse.headers.get("x-payment-settle");
    return Result.err(new PaymentHttpError({ status: paidResponse.status, settle: settleHeader }));
  }

  const settlement = httpClient.getPaymentSettleResponse((name: string) =>
    paidResponse.headers.get(name),
  );

  const bodyResult = await Result.tryPromise({
    try: () => paidResponse.text(),
    catch: () => new PaymentSetupError({ cause: "Failed to read response body" }),
  });
  if (Result.isError(bodyResult)) return Result.err(bodyResult.error);

  return Result.ok({
    url,
    status: paidResponse.status,
    paymentRequired: true,
    settlement,
    bodyPreview: bodyResult.value.slice(0, 500),
  });
}
