import { Horizon } from "@stellar/stellar-sdk";
import { Result } from "better-result";
import { HorizonError, UnfundedAccountError, NetworkTimeoutError } from "#/domain/errors.js";
import type {
  Network,
  PaginationOpts,
  AccountDetails,
  TransactionRecord,
  PaymentOperationRecord,
  EffectRecord,
  AssetRecord,
  OrderbookRecord,
  FeeStats,
  CandleRecord,
  TradeAggregationOpts,
  HorizonResult,
} from "#/domain/types.js";

const HORIZON_URLS: Record<Network, string> = {
  testnet: process.env.STECLI_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
  pubnet: process.env.STECLI_HORIZON_PUBNET_URL ?? "https://horizon-mainnet.stellar.org",
};

function horizonServer(network: Network): Horizon.Server {
  return new Horizon.Server(HORIZON_URLS[network]);
}

function classifyHorizonError(
  e: unknown,
  address?: string,
): HorizonError | UnfundedAccountError | NetworkTimeoutError {
  const message = e instanceof Error ? e.message : String(e);
  if (
    address &&
    (message.includes("404") || message.includes("not found") || message.includes("Not Found"))
  ) {
    return new UnfundedAccountError({ address });
  }
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  ) {
    return new NetworkTimeoutError({ cause: message });
  }
  return new HorizonError({ cause: message });
}

function withPagination<
  T extends { cursor(c: string): T; limit(l: number): T; order(o: string): T },
>(builder: T, opts?: PaginationOpts): T {
  let b = builder;
  if (opts?.cursor) b = b.cursor(opts.cursor);
  if (opts?.limit) b = b.limit(opts.limit);
  if (opts?.order) b = b.order(opts.order);
  return b;
}

function toTransactionRecord(raw: Horizon.ServerApi.TransactionRecord): TransactionRecord {
  return {
    id: raw.id,
    hash: raw.hash,
    createdAt: raw.created_at,
    ledger: typeof raw.ledger === "number" ? raw.ledger : 0,
    sourceAccount: raw.source_account,
    sourceAccountSequence: raw.source_account_sequence,
    feeCharged: raw.fee_charged,
    maxFee: raw.max_fee,
    operationCount: raw.operation_count,
    successful: raw.successful,
    memoType: raw.memo_type,
    memo: raw.memo ?? undefined,
  };
}

function toPaymentRecord(raw: Horizon.ServerApi.PaymentOperationRecord): PaymentOperationRecord {
  return {
    id: raw.id,
    from: raw.from,
    to: raw.to,
    amount: raw.amount,
    assetType: raw.asset_type,
    assetCode: raw.asset_code ?? undefined,
    assetIssuer: raw.asset_issuer ?? undefined,
    transactionHash: raw.transaction_hash,
    createdAt: raw.created_at,
  };
}

function toEffectRecord(raw: Horizon.ServerApi.EffectRecord): EffectRecord {
  return {
    id: raw.id,
    account: raw.account,
    type: raw.type,
    createdAt: raw.created_at,
  };
}

export async function getAccountDetails(
  publicKey: string,
  network: Network,
): Promise<HorizonResult<AccountDetails>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      const account = await server.loadAccount(publicKey);
      const flags = account.flags;
      return {
        id: account.id,
        accountId: account.account_id,
        sequence: account.sequence,
        subentryCount: account.subentry_count,
        thresholds: {
          low: account.thresholds.low_threshold,
          med: account.thresholds.med_threshold,
          high: account.thresholds.high_threshold,
        },
        balances: account.balances.map((b) => ({
          balance: b.balance,
          assetType: b.asset_type,
          assetCode:
            "asset_code" in b && typeof b.asset_code === "string" ? b.asset_code : undefined,
          assetIssuer:
            "asset_issuer" in b && typeof b.asset_issuer === "string" ? b.asset_issuer : undefined,
          limit: "limit" in b && typeof b.limit === "string" ? b.limit : undefined,
          buyingLiabilities:
            "buying_liabilities" in b && typeof b.buying_liabilities === "string"
              ? b.buying_liabilities
              : undefined,
          sellingLiabilities:
            "selling_liabilities" in b && typeof b.selling_liabilities === "string"
              ? b.selling_liabilities
              : undefined,
        })),
        signers: account.signers.map((s) => ({ key: s.key, weight: s.weight, type: s.type })),
        flags: {
          authRequired: flags.auth_required,
          authRevocable: flags.auth_revocable,
          authImmutable: flags.auth_immutable,
          authClawbackEnabled:
            "auth_clawback_enabled" in flags && flags.auth_clawback_enabled === true,
        },
        homeDomain:
          "home_domain" in account && typeof account.home_domain === "string"
            ? account.home_domain
            : undefined,
        lastModifiedLedger: account.last_modified_ledger,
        lastModifiedTime: account.last_modified_time,
      } satisfies AccountDetails;
    },
    catch: (e: unknown) => classifyHorizonError(e, publicKey),
  });
}

export async function getTransactions(
  publicKey: string,
  network: Network,
  opts?: PaginationOpts,
): Promise<HorizonResult<ReadonlyArray<TransactionRecord>>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      const builder = withPagination(server.transactions().forAccount(publicKey), opts);
      const page = await builder.call();
      return page.records.map(toTransactionRecord);
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getPayments(
  publicKey: string,
  network: Network,
  opts?: PaginationOpts,
): Promise<HorizonResult<ReadonlyArray<PaymentOperationRecord>>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      const builder = withPagination(server.payments().forAccount(publicKey), opts);
      const page = await builder.call();
      return page.records
        .filter((raw): raw is Horizon.ServerApi.PaymentOperationRecord => raw.type === "payment")
        .map(toPaymentRecord);
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getEffects(
  publicKey: string,
  network: Network,
  opts?: PaginationOpts,
): Promise<HorizonResult<ReadonlyArray<EffectRecord>>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      const builder = withPagination(server.effects().forAccount(publicKey), opts);
      const page = await builder.call();
      return page.records.map(toEffectRecord);
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getAssets(
  network: Network,
  opts?: PaginationOpts & { readonly code?: string; readonly issuer?: string },
): Promise<HorizonResult<ReadonlyArray<AssetRecord>>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      let builder = server.assets();
      if (opts?.code) builder = builder.forCode(opts.code);
      if (opts?.issuer) builder = builder.forIssuer(opts.issuer);
      builder = withPagination(builder, opts);
      const page = await builder.call();
      return page.records.map((a) => {
        const raw = a as unknown as Record<string, unknown>;
        return {
          assetType: a.asset_type,
          assetCode: a.asset_code,
          assetIssuer: a.asset_issuer,
          amount: typeof raw["amount"] === "string" ? raw["amount"] : "0",
          numAccounts: typeof raw["num_accounts"] === "number" ? raw["num_accounts"] : 0,
        } satisfies AssetRecord;
      });
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getOrderbook(
  selling: {
    readonly assetType: string;
    readonly assetCode?: string;
    readonly assetIssuer?: string;
  },
  buying: {
    readonly assetType: string;
    readonly assetCode?: string;
    readonly assetIssuer?: string;
  },
  network: Network,
  opts?: PaginationOpts,
): Promise<HorizonResult<OrderbookRecord>> {
  return Result.tryPromise({
    try: async () => {
      const { Asset } = await import("@stellar/stellar-sdk");
      const sellingAsset =
        selling.assetType === "native"
          ? Asset.native()
          : new Asset(selling.assetCode!, selling.assetIssuer!);
      const buyingAsset =
        buying.assetType === "native"
          ? Asset.native()
          : new Asset(buying.assetCode!, buying.assetIssuer!);
      const server = horizonServer(network);
      const builder = withPagination(server.orderbook(sellingAsset, buyingAsset), opts);
      const response = await builder.call();
      return {
        selling: {
          assetType: selling.assetType,
          assetCode: selling.assetCode,
          assetIssuer: selling.assetIssuer,
        },
        buying: {
          assetType: buying.assetType,
          assetCode: buying.assetCode,
          assetIssuer: buying.assetIssuer,
        },
        bids: response.bids.map((b) => ({ price: b.price, amount: b.amount })),
        asks: response.asks.map((a) => ({ price: a.price, amount: a.amount })),
      } satisfies OrderbookRecord;
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getFeeStats(network: Network): Promise<HorizonResult<FeeStats>> {
  return Result.tryPromise({
    try: async () => {
      const server = horizonServer(network);
      const stats = await server.feeStats();
      return {
        feeCharged: stats.fee_charged,
        maxFee: stats.max_fee,
        ledgerCapacity: stats.ledger_capacity_usage,
      } satisfies FeeStats;
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export async function getTradeAggregations(
  opts: TradeAggregationOpts,
  network: Network,
): Promise<HorizonResult<ReadonlyArray<CandleRecord>>> {
  return Result.tryPromise({
    try: async () => {
      const { Asset } = await import("@stellar/stellar-sdk");
      const baseAsset =
        opts.baseAssetType === "native"
          ? Asset.native()
          : new Asset(opts.baseAssetCode!, opts.baseAssetIssuer!);
      const counterAsset =
        opts.counterAssetType === "native"
          ? Asset.native()
          : new Asset(opts.counterAssetCode!, opts.counterAssetIssuer!);
      const server = horizonServer(network);
      let builder = server.tradeAggregation(
        baseAsset,
        counterAsset,
        opts.startTime ?? 0,
        opts.endTime ?? Date.now(),
        opts.resolution,
        opts.offset ?? 0,
      );
      builder = withPagination(builder, opts);
      const page = await builder.call();
      return page.records.map((raw) => ({
        timestamp: String(raw.timestamp),
        tradeCount: Number(raw.trade_count),
        baseVolume: String(raw.base_volume),
        counterVolume: String(raw.counter_volume),
        avg: String(raw.avg),
        high: String(raw.high),
        low: String(raw.low),
        open: String(raw.open),
        close: String(raw.close),
      }));
    },
    catch: (e: unknown) => classifyHorizonError(e),
  });
}

export function streamTransactions(
  publicKey: string,
  network: Network,
  opts: { cursor?: string },
  onMessage: (record: TransactionRecord) => void,
  onError: (error: unknown) => void,
): () => void {
  try {
    const server = horizonServer(network);
    let builder = server.transactions().forAccount(publicKey);
    if (opts.cursor) builder = builder.cursor(opts.cursor);
    return builder.stream({
      onmessage: (raw: Horizon.ServerApi.TransactionRecord) => {
        onMessage(toTransactionRecord(raw));
      },
      onerror: onError,
    });
  } catch (e: unknown) {
    throw classifyHorizonError(e);
  }
}

export function streamPayments(
  publicKey: string,
  network: Network,
  opts: { cursor?: string },
  onMessage: (record: PaymentOperationRecord) => void,
  onError: (error: unknown) => void,
): () => void {
  try {
    const server = horizonServer(network);
    let builder = server.payments().forAccount(publicKey);
    if (opts.cursor) builder = builder.cursor(opts.cursor);
    return builder.stream({
      onmessage: (raw) => {
        if (raw.type !== "payment") return;
        onMessage(toPaymentRecord(raw as Horizon.ServerApi.PaymentOperationRecord));
      },
      onerror: onError,
    });
  } catch (e: unknown) {
    throw classifyHorizonError(e);
  }
}

export function streamEffects(
  publicKey: string,
  network: Network,
  opts: { cursor?: string },
  onMessage: (record: EffectRecord) => void,
  onError: (error: unknown) => void,
): () => void {
  try {
    const server = horizonServer(network);
    let builder = server.effects().forAccount(publicKey);
    if (opts.cursor) builder = builder.cursor(opts.cursor);
    return builder.stream({
      onmessage: (raw: Horizon.ServerApi.EffectRecord) => {
        onMessage(toEffectRecord(raw));
      },
      onerror: onError,
    });
  } catch (e: unknown) {
    throw classifyHorizonError(e);
  }
}
