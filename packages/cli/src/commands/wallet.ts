import { defineCommand } from "citty";
import { walletLogin } from "./wallet-login.js";
import { walletVerify } from "./wallet-verify.js";
import { walletAddress } from "./wallet-address.js";
import { walletBalance } from "./wallet-balance.js";
import { walletTransfer } from "./wallet-transfer.js";
import { walletLogout } from "./wallet-logout.js";

export const walletCommand = defineCommand({
  meta: { name: "wallet", description: "Wallet management commands" },
  subCommands: {
    login: walletLogin,
    verify: walletVerify,
    address: walletAddress,
    balance: walletBalance,
    transfer: walletTransfer,
    logout: walletLogout,
  },
});
