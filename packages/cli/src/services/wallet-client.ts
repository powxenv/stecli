import { Result } from "better-result";
import { WalletNotFoundError, WalletFetchError, WalletCreateError } from "#/domain/errors.js";
import type { WalletInfo, WalletResult } from "#/domain/types.js";
import { loadSession } from "#/services/session.js";

const API_BASE_URL = process.env.STECLI_API_URL ?? "https://stecli.noval.me";

export interface WalletAddress {
  readonly publicKey: string;
  readonly network: string;
  readonly email: string;
}

function requireSession(): WalletResult<SessionData> {
  const sessionResult = loadSession();
  if (Result.isError(sessionResult)) {
    return Result.err(new WalletNotFoundError());
  }
  const session = sessionResult.value;
  if (!("token" in session) || !("email" in session)) {
    return Result.err(new WalletNotFoundError());
  }
  return Result.ok(session);
}

interface SessionData {
  readonly token: string;
  readonly email: string;
}

export async function fetchWallet(): Promise<WalletResult<WalletInfo>> {
  const sessionResult = requireSession();
  if (Result.isError(sessionResult)) return Result.err(sessionResult.error);
  const s = sessionResult.value;

  return Result.tryPromise({
    try: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cli/wallet`, {
        headers: { authorization: `Bearer ${s.token}` },
      });
      if (!res.ok) {
        throw new WalletFetchError({ cause: String(res.status) });
      }
      const data = (await res.json()) as { ok: boolean; wallet: WalletInfo };
      return data.wallet;
    },
    catch: (e: unknown): WalletFetchError =>
      e instanceof WalletFetchError ? e : new WalletFetchError({ cause: String(e) }),
  });
}

export async function fetchAddress(): Promise<WalletResult<WalletAddress>> {
  const sessionResult = requireSession();
  if (Result.isError(sessionResult)) return Result.err(sessionResult.error);
  const s = sessionResult.value;

  return Result.tryPromise({
    try: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cli/wallet/address`, {
        headers: { authorization: `Bearer ${s.token}` },
      });
      if (!res.ok) {
        throw new WalletFetchError({ cause: String(res.status) });
      }
      const data = (await res.json()) as { ok: boolean; address: WalletAddress };
      return data.address;
    },
    catch: (e: unknown): WalletFetchError =>
      e instanceof WalletFetchError ? e : new WalletFetchError({ cause: String(e) }),
  });
}

export async function createWallet(network: string): Promise<WalletResult<WalletInfo>> {
  const sessionResult = requireSession();
  if (Result.isError(sessionResult)) return Result.err(sessionResult.error);
  const s = sessionResult.value;

  return Result.tryPromise({
    try: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cli/wallet/create`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${s.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ network }),
      });
      if (!res.ok) {
        throw new WalletCreateError({ cause: String(res.status) });
      }
      const data = (await res.json()) as { ok: boolean; created: boolean; wallet: WalletInfo };
      return data.wallet;
    },
    catch: (e: unknown): WalletCreateError =>
      e instanceof WalletCreateError ? e : new WalletCreateError({ cause: String(e) }),
  });
}
