import { defineCommand } from "citty";
import { accountDetails } from "./account-details.js";
import { accountTransactions } from "./account-transactions.js";
import { accountPayments } from "./account-payments.js";
import { accountEffects } from "./account-effects.js";

export { accountDetails } from "./account-details.js";
export { accountTransactions } from "./account-transactions.js";
export { accountPayments } from "./account-payments.js";
export { accountEffects } from "./account-effects.js";

export const accountCommand = defineCommand({
  meta: { name: "account", description: "Query Stellar account data from Horizon" },
  subCommands: {
    details: accountDetails,
    transactions: accountTransactions,
    payments: accountPayments,
    effects: accountEffects,
  },
});
