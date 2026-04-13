import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from "node:crypto";
import { env } from "cloudflare:workers";

const ENCRYPTION_KEY_LENGTH = 32;

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(env.WALLET_ENCRYPTION_KEY, salt, ENCRYPTION_KEY_LENGTH);
}

export function encryptSecretKey(secretKey: string): {
  encrypted: string;
  salt: string;
  iv: string;
} {
  const salt = randomBytes(16);
  const key = deriveKey(salt);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secretKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, authTag]).toString("hex"),
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decryptSecretKey(encryptedHex: string, saltHex: string, ivHex: string): string {
  const data = Buffer.from(encryptedHex, "hex");
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const key = deriveKey(salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
