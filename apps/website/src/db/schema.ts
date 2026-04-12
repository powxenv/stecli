import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const wallets = pgTable("wallets", {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  publicKey: text("public_key").notNull(),
  encryptedSecretKey: text("encrypted_secret_key").notNull(),
  salt: text().notNull(),
  iv: text().notNull(),
  network: text().notNull().default("testnet"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const walletSessions = pgTable("wallet_sessions", {
  id: serial().primaryKey(),
  email: text().notNull(),
  token: text().notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
