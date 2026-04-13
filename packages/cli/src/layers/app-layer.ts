import { Layer } from "effect";
import { SessionLive } from "#/services/session.js";
import { AuthLive } from "#/services/auth.js";
import { WalletClientLive } from "#/services/wallet-client.js";
import { StellarLive } from "#/services/stellar.js";
import { HorizonLive } from "#/services/horizon.js";
import { AuditLive } from "#/services/audit.js";
import { PaymentLive } from "#/services/payment.js";

const ServiceLive = Layer.merge(
  SessionLive,
  Layer.merge(AuthLive, Layer.merge(StellarLive, HorizonLive)),
);

const WithWallet = Layer.provide(WalletClientLive, ServiceLive);

const WithPayment = Layer.provide(PaymentLive, Layer.merge(ServiceLive, WithWallet));

const WithAudit = Layer.provide(AuditLive, Layer.merge(ServiceLive, WithPayment));

export const AppLive = WithAudit;
