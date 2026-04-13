import { Result } from "better-result";
import { Horizon } from "@stellar/stellar-sdk";
import { fetchWallet } from "#/services/wallet-client.js";
import type { Network, PreflightCheck, PreflightBalance, WalletResult } from "#/domain/types.js";

const HORIZON_URLS: Record<Network, string> = {
  testnet: process.env.STELAGENT_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
  pubnet: process.env.STELAGENT_HORIZON_PUBNET_URL ?? "https://horizon-mainnet.stellar.org",
};

const BASE_RESERVE = "1";
const LINE_RESERVE = "0.5";

export async function preflightSend(
  destination: string,
  amount: string,
  assetStr: string,
  network: Network,
): Promise<WalletResult<PreflightCheck>> {
  const walletResult = await fetchWallet();
  if (Result.isError(walletResult)) return Result.err(walletResult.error);

  const wallet = walletResult.value;
  const sender = wallet.publicKey;
  const server = new Horizon.Server(HORIZON_URLS[network]);

  let senderAccount: Horizon.AccountResponse;
  let senderFunded = true;
  let destinationFunded = true;
  let destinationFundingRequired = false;
  const warnings: string[] = [];

  try {
    senderAccount = await server.loadAccount(sender);
  } catch {
    senderFunded = false;
    const msg =
      wallet.network === "testnet"
        ? `Sender account ${sender.slice(0, 8)}... is not funded. Use wallet login to auto-fund on testnet.`
        : `Sender account ${sender.slice(0, 8)}... is not funded. Send at least 1 XLM to activate it.`;
    return Result.ok({
      canProceed: false,
      sender,
      destination,
      amount,
      asset: assetStr === "native" ? "XLM" : assetStr,
      network,
      senderFunded,
      destinationFunded: true,
      destinationFundingRequired: false,
      balances: [],
      estimatedFee: "0",
      baseReserve: BASE_RESERVE,
      warnings: [msg],
    });
  }

  let feeStatsResult: { feeCharged: { mode: string }; maxFee: { mode: string } };
  try {
    const stats = await server.feeStats();
    feeStatsResult = {
      feeCharged: { mode: stats.fee_charged.mode },
      maxFee: { mode: stats.max_fee.mode },
    };
  } catch {
    feeStatsResult = { feeCharged: { mode: "100" }, maxFee: { mode: "100" } };
  }

  const estimatedFee = feeStatsResult.feeCharged.mode;

  const balances: PreflightBalance[] = [];
  let sufficientOverall = true;

  for (const b of senderAccount.balances) {
    const code = b.asset_type === "native" ? "XLM" : "asset_code" in b ? String(b.asset_code) : "";
    const available = Number(b.balance);

    if (b.asset_type === "native") {
      const subentryCount = senderAccount.subentry_count;
      const minReserve = Number(BASE_RESERVE) + Number(LINE_RESERVE) * subentryCount;
      const effectiveAvailable = available - minReserve;
      const neededForSend = Number(amount);
      const needed = neededForSend + Number(estimatedFee) / 1e7;
      const sufficient = effectiveAvailable >= needed;

      if (!sufficient) sufficientOverall = false;

      balances.push({
        asset: "XLM",
        available: effectiveAvailable.toFixed(7),
        needed: needed.toFixed(7),
        sufficient,
      });
    } else if ((assetStr !== "native" && code === assetStr.split(":")[0]) || assetStr === code) {
      const needed = Number(amount);
      const sufficient = available >= needed;
      if (!sufficient) sufficientOverall = false;

      balances.push({
        asset: code,
        available: available.toFixed(7),
        needed: needed.toFixed(7),
        sufficient,
      });
    }
  }

  try {
    await server.loadAccount(destination);
  } catch {
    destinationFunded = false;
    destinationFundingRequired = true;
    if (assetStr === "native") {
      warnings.push(
        `Destination ${destination.slice(0, 8)}... is not funded. The transaction will create the account if amount >= 1 XLM.`,
      );
    } else {
      warnings.push(
        `Destination ${destination.slice(0, 8)}... is not funded. Cannot send custom assets to an unfunded account. The destination must first receive XLM.`,
      );
      sufficientOverall = false;
    }
  }

  if (assetStr === "native") {
    const totalNeeded = Number(amount) + Number(estimatedFee) / 1e7;
    const xlmBalance = senderAccount.balances.find((b) => b.asset_type === "native");
    if (xlmBalance) {
      const subentryCount = senderAccount.subentry_count;
      const minReserve = Number(BASE_RESERVE) + Number(LINE_RESERVE) * subentryCount;
      const remaining = Number(xlmBalance.balance) - totalNeeded - minReserve;
      if (remaining < 0) {
        warnings.push(
          `After sending ${amount} XLM + fees, remaining balance would fall below minimum reserve (${minReserve} XLM).`,
        );
      }
    }
  }

  const canProceed = senderFunded && sufficientOverall;

  return Result.ok({
    canProceed,
    sender,
    destination,
    amount,
    asset: assetStr === "native" ? "XLM" : assetStr,
    network,
    senderFunded,
    destinationFunded,
    destinationFundingRequired,
    balances,
    estimatedFee,
    baseReserve: BASE_RESERVE,
    warnings,
  });
}
