import { defineCommand, runMain } from "citty";
import { walletCommand } from "./commands/wallet.js";
import { payCommand } from "./commands/pay.js";
import { accountCommand } from "./commands/account.js";
import { assetsCommand } from "./commands/assets.js";
import { sendCommand } from "./commands/send.js";
import { feeCommand } from "./commands/fee.js";
import { monitorCommand } from "./commands/monitor.js";
import { mcpCommand } from "./commands/mcp.js";
import { preflightCommand } from "./commands/preflight.js";

const mainCommand = defineCommand({
  meta: {
    name: "stelagent",
    version: "0.1.0",
    description: "Modular, agent-first CLI for Stellar — wallet, payments, markets, and DeFi",
  },
  subCommands: {
    wallet: walletCommand,
    pay: payCommand,
    account: accountCommand,
    assets: assetsCommand,
    send: sendCommand,
    fee: feeCommand,
    monitor: monitorCommand,
    mcp: mcpCommand,
    preflight: preflightCommand,
  },
});

runMain(mainCommand).catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
