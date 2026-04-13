import { Layer } from "effect";
import { OutputLive } from "#/services/output.js";
import { SessionLive } from "#/services/session.js";
import { AuthLive } from "#/services/auth.js";
import { WalletClientLive } from "#/services/wallet-client.js";
import { StellarLive } from "#/services/stellar.js";
import { HorizonLive } from "#/services/horizon.js";
import { AuditLive } from "#/services/audit.js";
import { PaymentLive } from "#/services/payment.js";

const BaseLive = Layer.merge(
  OutputLive,
  Layer.merge(SessionLive, Layer.merge(AuthLive, StellarLive)),
);

const WithHorizon = Layer.merge(BaseLive, HorizonLive);

const WithWallet = Layer.provide(WalletClientLive, WithHorizon);

const WithPayment = Layer.provide(PaymentLive, Layer.merge(WithHorizon, WithWallet));

const WithAudit = Layer.provide(AuditLive, Layer.merge(WithHorizon, WithPayment));

export const AppLive = WithAudit;
