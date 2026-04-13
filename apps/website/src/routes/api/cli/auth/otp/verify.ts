import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { eq, and, gt, sql } from "drizzle-orm";
import { walletSessions, otpCodes } from "#/db/schema";
import { getDb } from "#/db/index.ts";

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

        const db = getDb();

        const records = await db
          .select()
          .from(otpCodes)
          .where(and(eq(otpCodes.email, body.email), gt(otpCodes.expiresAt, new Date())))
          .orderBy(sql`${otpCodes.createdAt} DESC`)
          .limit(1);

        if (records.length === 0) {
          return Response.json({ ok: false, error: "OTP expired or not found" }, { status: 400 });
        }

        const record = records[0];

        if (record.attempts >= 5) {
          await db.delete(otpCodes).where(eq(otpCodes.id, record.id));
          return Response.json({ ok: false, error: "Too many attempts" }, { status: 429 });
        }

        await db
          .update(otpCodes)
          .set({ attempts: record.attempts + 1 })
          .where(eq(otpCodes.id, record.id));

        if (record.code !== body.otp) {
          return Response.json({ ok: false, error: "Invalid OTP" }, { status: 400 });
        }

        await db.delete(otpCodes).where(eq(otpCodes.id, record.id));

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
