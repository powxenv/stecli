import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { db, walletSessions } from "#/db/server.ts";

export const Route = createFileRoute("/api/cli/auth/otp/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          email?: string;
          otp?: string;
        };
        if (!body.email || !body.otp) {
          return Response.json({ ok: false, error: "Email and OTP are required" }, { status: 400 });
        }

        // TODO: Replace with real OTP verification
        if (body.otp.length < 4) {
          return Response.json({ ok: false, error: "Invalid OTP" }, { status: 400 });
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.insert(walletSessions).values({
          email: body.email,
          token,
          expiresAt,
        });

        return Response.json({
          ok: true,
          verified: true,
          token,
          email: body.email,
        });
      },
    },
  },
});
