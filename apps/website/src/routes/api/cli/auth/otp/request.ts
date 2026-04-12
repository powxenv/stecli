import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";

export const Route = createFileRoute("/api/cli/auth/otp/request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { email?: string };
        if (!body.email) {
          return Response.json({ ok: false, error: "Email is required" }, { status: 400 });
        }

        return Response.json({
          ok: true,
          flowId: randomBytes(8).toString("hex"),
          message: `OTP sent to ${body.email}`,
        });
      },
    },
  },
});
