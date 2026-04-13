import { Context, Effect, Layer } from "effect";
import { SessionService } from "#/services/session.js";
import { WalletNotFoundError, WalletFetchError, WalletCreateError } from "#/domain/errors.js";
import type { WalletInfo } from "#/domain/types.js";

const API_BASE_URL = process.env.STECLI_API_URL ?? "https://stecli.dev";

export class WalletClientService extends Context.Tag("WalletClientService")<
  WalletClientService,
  {
    readonly fetchWallet: () => Effect.Effect<WalletInfo, WalletNotFoundError | WalletFetchError>;
    readonly createWallet: (
      network: string,
    ) => Effect.Effect<WalletInfo, WalletNotFoundError | WalletCreateError>;
  }
>() {}

export const WalletClientLive = Layer.effect(
  WalletClientService,
  Effect.gen(function* () {
    const session = yield* SessionService;

    return {
      fetchWallet: () =>
        Effect.gen(function* () {
          const s = yield* session.load().pipe(Effect.mapError(() => new WalletNotFoundError()));
          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${API_BASE_URL}/api/cli/wallet`, {
                headers: { authorization: `Bearer ${s.token}` },
              }).then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json() as Promise<{ ok: boolean; wallet: WalletInfo }>;
              }),
            catch: (e: unknown) => new WalletFetchError({ cause: String(e) }),
          });
          return response.wallet;
        }),

      createWallet: (network: string) =>
        Effect.gen(function* () {
          const s = yield* session.load().pipe(Effect.mapError(() => new WalletNotFoundError()));
          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${API_BASE_URL}/api/cli/wallet/create`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${s.token}`,
                  "content-type": "application/json",
                },
                body: JSON.stringify({ network }),
              }).then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json() as Promise<{ ok: boolean; created: boolean; wallet: WalletInfo }>;
              }),
            catch: (e: unknown) => new WalletCreateError({ cause: String(e) }),
          });
          return response.wallet;
        }),
    };
  }),
);
