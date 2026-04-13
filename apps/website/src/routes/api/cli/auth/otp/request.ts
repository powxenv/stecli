import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { createElement } from "react";
import { eq, and, gt } from "drizzle-orm";
import { render } from "@react-email/components";
import { resend } from "#/lib/server/resend.ts";
import { otpCodes } from "#/db/schema";
import { db } from "#/db/index.ts";
import OtpEmail from "../../../../../../emails/email.tsx";

export const Route = createFileRoute("/api/cli/auth/otp/request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { email?: string };
        if (!body.email) {
          return Response.json({ ok: false, error: "Email is required" }, { status: 400 });
        }

        const email = body.email;
        const code = randomDigits(6);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db
          .delete(otpCodes)
          .where(and(eq(otpCodes.email, email), gt(otpCodes.expiresAt, new Date())));

        await db.insert(otpCodes).values({
          email,
          code,
          expiresAt,
        });

        const html = await render(createElement(OtpEmail, { otp: code, email }));

        const { error } = await resend.emails.send({
          from: "Stecli <send@mail.stecli.noval.me>",
          to: [email],
          subject: `Your verification code is ${code}`,
          html,
        });

        if (error) {
          return Response.json({ ok: false, error: "Failed to send email" }, { status: 500 });
        }

        return Response.json({
          ok: true,
          message: `OTP sent to ${email}`,
        });
      },
    },
  },
});

function randomDigits(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += (bytes[i]! % 10).toString();
  }
  return result;
}
