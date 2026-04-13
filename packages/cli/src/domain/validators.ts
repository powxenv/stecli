import { z } from "zod";

export const stellarPublicKey = z
  .string()
  .regex(
    /^G[A-Z2-7]{55}$/,
    "Invalid Stellar public key. Must start with 'G' followed by 55 alphanumeric characters.",
  );

export const emailSchema = z.string().email("Invalid email address.");

export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,7})?$/, "Invalid amount. Must be a number with up to 7 decimal places.");

export const assetSchema = z.union([
  z.literal("native"),
  z
    .string()
    .regex(
      /^[A-Za-z0-9]{1,12}:[A-Z2-7]{56}$/,
      "Invalid asset format. Use 'native' for XLM or 'CODE:ISSUER' for custom assets.",
    ),
]);

export const memoSchema = z.string().max(28, "Memo text must be 28 characters or fewer.");

export const cursorSchema = z.string().min(1, "Cursor must be a non-empty string.");

export const otpSchema = z.string().regex(/^\d{4,8}$/, "OTP must be 4-8 digits.");

export const urlSchema = z.string().url("Invalid URL.");

export const networkSchema = z.enum(["testnet", "pubnet"]);

export const formatSchema = z.enum(["json", "text"]);

export const limitSchema = z.coerce.number().int().min(1).max(200).default(10);

export const orderSchema = z.enum(["asc", "desc"]).default("desc");

export const resolutionSchema = z.coerce.number().int().min(60000);

export const validatePublicKey = (value: string): string => {
  return stellarPublicKey.parse(value);
};

export const validateEmail = (value: string): string => {
  return emailSchema.parse(value);
};

export const validateAmount = (value: string): string => {
  return amountSchema.parse(value);
};

export const validateAsset = (value: string): string => {
  return assetSchema.parse(value);
};
