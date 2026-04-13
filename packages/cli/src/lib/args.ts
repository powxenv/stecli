import { Result } from "better-result";
import { InvalidNetworkError } from "#/domain/errors.js";
import type { StringArgDef } from "citty";

export const networkArg: StringArgDef = {
  type: "string",
  alias: ["n"],
  description: "Network: testnet or pubnet",
  default: "testnet",
};

export const formatArg: StringArgDef = {
  type: "string",
  alias: ["f"],
  description: "Output format: json or text",
  default: "json",
};

export function parseNetwork(value: string): Result<"testnet" | "pubnet", InvalidNetworkError> {
  if (value === "testnet" || value === "pubnet") return Result.ok(value);
  return Result.err(new InvalidNetworkError({ provided: value }));
}

export function parseFormat(value: string): "json" | "text" {
  if (value === "json" || value === "text") return value;
  return "json";
}
