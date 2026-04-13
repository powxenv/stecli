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

export function parseNetwork(value: string): "testnet" | "pubnet" {
  if (value !== "testnet" && value !== "pubnet") {
    throw new Error("Invalid network. Must be 'testnet' or 'pubnet'.");
  }
  return value;
}

export function parseFormat(value: string): "json" | "text" {
  if (value !== "json" && value !== "text") {
    throw new Error("Invalid format. Must be 'json' or 'text'.");
  }
  return value;
}
