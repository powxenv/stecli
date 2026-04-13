import { Result } from "better-result";
import { AuthRequestError, OtpVerifyError } from "#/domain/errors.js";
import type { OtpResponse, VerifyResponse, AuthResult } from "#/domain/types.js";

const API_BASE_URL = process.env.STECLI_API_URL ?? "https://stecli.noval.me";

export function requestOtp(email: string): Promise<AuthResult<OtpResponse>> {
  return Result.tryPromise({
    try: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cli/auth/otp/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        return Result.err(new AuthRequestError({ cause: `${res.status} ${res.statusText}` }));
      }
      const data = (await res.json()) as OtpResponse;
      return Result.ok(data);
    },
    catch: (e: unknown) =>
      new AuthRequestError({ cause: e instanceof Error ? e.message : String(e) }),
  }).then(Result.flatten);
}

export function verifyOtp(email: string, otp: string): Promise<AuthResult<VerifyResponse>> {
  return Result.tryPromise({
    try: async () => {
      const res = await fetch(`${API_BASE_URL}/api/cli/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        return Result.err(new OtpVerifyError({ cause: `${res.status} ${res.statusText}` }));
      }
      const data = (await res.json()) as VerifyResponse;
      return Result.ok(data);
    },
    catch: (e: unknown) =>
      new OtpVerifyError({ cause: e instanceof Error ? e.message : String(e) }),
  }).then(Result.flatten);
}
