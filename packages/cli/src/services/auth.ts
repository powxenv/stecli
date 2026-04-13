import { Context, Effect, Layer } from "effect";
import { AuthRequestError, OtpVerifyError } from "#/domain/errors.js";
import type { OtpResponse, VerifyResponse } from "#/domain/types.js";

const API_BASE_URL = process.env.STECLI_API_URL ?? "https://stecli.dev";

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly requestOtp: (email: string) => Effect.Effect<OtpResponse, AuthRequestError>;
    readonly verifyOtp: (
      email: string,
      otp: string,
    ) => Effect.Effect<VerifyResponse, OtpVerifyError>;
  }
>() {}

export const AuthLive = Layer.succeed(AuthService, {
  requestOtp: (email: string) =>
    Effect.tryPromise({
      try: () =>
        fetch(`${API_BASE_URL}/api/cli/auth/otp/request`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<OtpResponse>;
        }),
      catch: (e: unknown) =>
        new AuthRequestError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  verifyOtp: (email: string, otp: string) =>
    Effect.tryPromise({
      try: () =>
        fetch(`${API_BASE_URL}/api/cli/auth/otp/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<VerifyResponse>;
        }),
      catch: (e: unknown) =>
        new OtpVerifyError({ cause: e instanceof Error ? e.message : String(e) }),
    }),
});
