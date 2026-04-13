import { Resend } from "resend";
import { env } from "cloudflare:workers";

let _resend: Resend | null = null;

export function getResend() {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}
