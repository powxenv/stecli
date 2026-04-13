import { defineCommand } from "citty";
import { monitorTransactions } from "./monitor-transactions.js";
import { monitorPayments } from "./monitor-payments.js";
import { monitorEffects } from "./monitor-effects.js";

export { monitorTransactions } from "./monitor-transactions.js";
export { monitorPayments } from "./monitor-payments.js";
export { monitorEffects } from "./monitor-effects.js";

export const monitorCommand = defineCommand({
  meta: { name: "monitor", description: "Stream live data from Horizon via SSE" },
  subCommands: {
    transactions: monitorTransactions,
    payments: monitorPayments,
    effects: monitorEffects,
  },
});
