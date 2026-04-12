import { defineCommand, runMain } from "citty";
import { walletCommand } from "./commands/wallet.js";
import { payCommand } from "./commands/pay.js";

const mainCommand = defineCommand({
  meta: {
    name: "centsh-agent",
    version: "0.1.0",
    description: "Agentic wallet CLI for Stellar with x402 payments",
  },
  subCommands: {
    wallet: walletCommand,
    pay: payCommand,
  },
});

runMain(mainCommand).catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
