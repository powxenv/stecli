import { Layer } from "effect";
import { OutputLive } from "#/services/output.js";
import { SessionLive } from "#/services/session.js";
import { AuthLive } from "#/services/auth.js";
import { WalletClientLive } from "#/services/wallet-client.js";
import { StellarLive } from "#/services/stellar.js";
import { PaymentLive } from "#/services/payment.js";

const BaseLive = Layer.merge(
  OutputLive,
  Layer.merge(SessionLive, Layer.merge(AuthLive, StellarLive)),
);

const WithWallet = Layer.provide(WalletClientLive, BaseLive);

const WithPayment = Layer.provide(PaymentLive, Layer.merge(BaseLive, WithWallet));

export const AppLive = Layer.merge(Layer.merge(BaseLive, WithWallet), WithPayment);
