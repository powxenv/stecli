import { Context, Effect, Layer } from "effect";
import { Horizon } from "@stellar/stellar-sdk";
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
} from "#/domain/types.js";

const HORIZON_URLS: Record<Network, string> = {
  testnet: process.env.STECLI_HORIZON_TESTNET_URL ?? "https://horizon-testnet.stellar.org",
  pubnet: process.env.STECLI_HORIZON_PUBNET_URL ?? "https://horizon-mainnet.stellar.org",
};

function horizonServer(network: Network): Horizon.Server {
  return new Horizon.Server(HORIZON_URLS[network]);
}

function isNotFoundError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("404") || message.includes("not found") || message.includes("Not Found"))
    return true;
  if (typeof e === "object" && e !== null && "response" in e) {
    const resp = (e as { response?: { status?: number } }).response;
    if (resp?.status === 404) return true;
  }
  return false;
}

function isTimeoutError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  return (
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  );
}

function classifyHorizonError(e: unknown, address?: string): Error {
  if (address && isNotFoundError(e)) return new UnfundedAccountError({ address });
  if (isTimeoutError(e))
    return new NetworkTimeoutError({ cause: e instanceof Error ? e.message : String(e) });
  return new HorizonError({ cause: e instanceof Error ? e.message : String(e) });
}

function withPagination<
  T extends { cursor(c: string): T; limit(l: number): T; order(o: string): T },
>(builder: T, opts?: PaginationOpts): T {
  let b = builder;
  if (opts?.cursor) b = b.cursor(opts.cursor) as T;
  if (opts?.limit) b = b.limit(opts.limit) as T;
  if (opts?.order) b = b.order(opts.order) as T;
  return b;
}

export class HorizonService extends Context.Tag("HorizonService")<
  HorizonService,
  {
    readonly getAccountDetails: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<AccountDetails, HorizonError | UnfundedAccountError | NetworkTimeoutError>;
    readonly getTransactions: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<TransactionRecord>, HorizonError>;
    readonly getPayments: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<PaymentOperationRecord>, HorizonError>;
    readonly getEffects: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<EffectRecord>, HorizonError>;
    readonly getAssets: (
      network: Network,
      opts?: PaginationOpts & { readonly code?: string; readonly issuer?: string },
    ) => Effect.Effect<ReadonlyArray<AssetRecord>, HorizonError>;
    readonly getOrderbook: (
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
    ) => Effect.Effect<OrderbookRecord, HorizonError>;
    readonly getFeeStats: (network: Network) => Effect.Effect<FeeStats, HorizonError>;
    readonly getTradeAggregations: (
      opts: TradeAggregationOpts,
      network: Network,
    ) => Effect.Effect<ReadonlyArray<CandleRecord>, HorizonError>;
    readonly streamTransactions: (
      publicKey: string,
      network: Network,
      opts: { cursor?: string },
      onMessage: (record: TransactionRecord) => void,
      onError: (error: unknown) => void,
    ) => Effect.Effect<() => void, HorizonError>;
    readonly streamPayments: (
      publicKey: string,
      network: Network,
      opts: { cursor?: string },
      onMessage: (record: PaymentOperationRecord) => void,
      onError: (error: unknown) => void,
    ) => Effect.Effect<() => void, HorizonError>;
    readonly streamEffects: (
      publicKey: string,
      network: Network,
      opts: { cursor?: string },
      onMessage: (record: EffectRecord) => void,
      onError: (error: unknown) => void,
    ) => Effect.Effect<() => void, HorizonError>;
  }
>() {}

export const HorizonLive = Layer.succeed(HorizonService, {
  getAccountDetails: (publicKey: string, network: Network) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        let account: Awaited<ReturnType<typeof server.loadAccount>>;
        try {
          account = await server.loadAccount(publicKey);
        } catch (e: unknown) {
          throw classifyHorizonError(e, publicKey);
        }
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
            assetCode: "asset_code" in b ? (b.asset_code as string | undefined) : undefined,
            assetIssuer: "asset_issuer" in b ? (b.asset_issuer as string | undefined) : undefined,
            limit: "limit" in b ? (b.limit as string | undefined) : undefined,
            buyingLiabilities:
              "buying_liabilities" in b ? (b.buying_liabilities as string | undefined) : undefined,
            sellingLiabilities:
              "selling_liabilities" in b
                ? (b.selling_liabilities as string | undefined)
                : undefined,
          })),
          signers: account.signers.map((s) => ({ key: s.key, weight: s.weight, type: s.type })),
          flags: {
            authRequired: account.flags.auth_required,
            authRevocable: account.flags.auth_revocable,
            authImmutable: account.flags.auth_immutable,
            authClawbackEnabled:
              (account.flags as unknown as Record<string, unknown>).auth_clawback_enabled === true,
          },
          homeDomain: (account as unknown as Record<string, unknown>).home_domain as
            | string
            | undefined,
          lastModifiedLedger: account.last_modified_ledger,
          lastModifiedTime: account.last_modified_time,
        } satisfies AccountDetails;
      },
      catch: (e: unknown) => {
        if (e instanceof UnfundedAccountError || e instanceof NetworkTimeoutError) return e;
        return new HorizonError({ cause: e instanceof Error ? e.message : String(e) });
      },
    }),

  getTransactions: (publicKey: string, network: Network, opts?: PaginationOpts) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        const builder = withPagination(server.transactions().forAccount(publicKey), opts);
        const page = await builder.call();
        return (page.records as unknown[]).map((rawTx: unknown) => {
          const tx = rawTx as Record<string, unknown>;
          return {
            id: tx.id as string,
            hash: tx.hash as string,
            createdAt: tx.created_at as string,
            ledger: typeof tx.ledger === "number" ? tx.ledger : 0,
            sourceAccount: tx.source_account as string,
            sourceAccountSequence: tx.source_account_sequence as string,
            feeCharged: tx.fee_charged as string | number,
            maxFee: tx.max_fee as string | number,
            operationCount: tx.operation_count as number,
            successful: tx.successful as boolean,
            memoType: tx.memo_type as string,
            memo: (tx.memo as string | undefined) ?? undefined,
          } satisfies TransactionRecord;
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getPayments: (publicKey: string, network: Network, opts?: PaginationOpts) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        const builder = withPagination(server.payments().forAccount(publicKey), opts);
        const page = await builder.call();
        return (page.records as unknown[])
          .filter((rawOp: unknown) => (rawOp as Record<string, unknown>).type === "payment")
          .map((rawOp: unknown) => {
            const op = rawOp as Record<string, unknown>;
            return {
              id: op.id as string,
              from: op.from as string,
              to: op.to as string,
              amount: op.amount as string,
              assetType: op.asset_type as string,
              assetCode: (op.asset_code as string | undefined) ?? undefined,
              assetIssuer: (op.asset_issuer as string | undefined) ?? undefined,
              transactionHash: op.transaction_hash as string,
              createdAt: op.created_at as string,
            } satisfies PaymentOperationRecord;
          });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getEffects: (publicKey: string, network: Network, opts?: PaginationOpts) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        const builder = withPagination(server.effects().forAccount(publicKey), opts);
        const page = await builder.call();
        return page.records.map((ef: unknown) => {
          const record = ef as Record<string, unknown>;
          return {
            id: record.id as string,
            account: record.account as string,
            type: record.type as string,
            createdAt: record.created_at as string,
          } satisfies EffectRecord;
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getAssets: (
    network: Network,
    opts?: PaginationOpts & { readonly code?: string; readonly issuer?: string },
  ) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        let builder = server.assets();
        if (opts?.code) builder = builder.forCode(opts.code);
        if (opts?.issuer) builder = builder.forIssuer(opts.issuer);
        builder = withPagination(builder, opts);
        const page = await builder.call();
        return page.records.map((a: unknown) => {
          const record = a as Record<string, unknown>;
          return {
            assetType: record.asset_type as string,
            assetCode: record.asset_code as string,
            assetIssuer: record.asset_issuer as string,
            amount: record.amount as string,
            numAccounts: record.num_accounts as number,
          } satisfies AssetRecord;
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getOrderbook: (
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
  ) =>
    Effect.tryPromise({
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
          bids: response.bids.map((b: { price: string; amount: string }) => ({
            price: b.price,
            amount: b.amount,
          })),
          asks: response.asks.map((a: { price: string; amount: string }) => ({
            price: a.price,
            amount: a.amount,
          })),
        } satisfies OrderbookRecord;
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getFeeStats: (network: Network) =>
    Effect.tryPromise({
      try: async () => {
        const server = horizonServer(network);
        const stats = await server.feeStats();
        return {
          feeCharged: stats.fee_charged,
          maxFee: stats.max_fee,
          ledgerCapacity: stats.ledger_capacity_usage,
        } satisfies FeeStats;
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  getTradeAggregations: (opts: TradeAggregationOpts, network: Network) =>
    Effect.tryPromise({
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
        return page.records.map((raw: unknown) => {
          const record = raw as Record<string, unknown>;
          return {
            timestamp: String(record.timestamp),
            tradeCount: Number(record.trade_count),
            baseVolume: String(record.base_volume),
            counterVolume: String(record.counter_volume),
            avg: String(record.avg),
            high: String(record.high),
            low: String(record.low),
            open: String(record.open),
            close: String(record.close),
          } satisfies CandleRecord;
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  streamTransactions: (publicKey, network, opts, onMessage, onError) =>
    Effect.try({
      try: () => {
        const server = horizonServer(network);
        let builder = server.transactions().forAccount(publicKey);
        if (opts.cursor) builder = builder.cursor(opts.cursor);
        return builder.stream({
          onmessage: (raw: unknown) => {
            const tx = raw as Record<string, unknown>;
            onMessage({
              id: tx.id as string,
              hash: tx.hash as string,
              createdAt: tx.created_at as string,
              ledger: typeof tx.ledger === "number" ? tx.ledger : 0,
              sourceAccount: tx.source_account as string,
              sourceAccountSequence: tx.source_account_sequence as string,
              feeCharged: tx.fee_charged as string | number,
              maxFee: tx.max_fee as string | number,
              operationCount: tx.operation_count as number,
              successful: tx.successful as boolean,
              memoType: tx.memo_type as string,
              memo: (tx.memo as string | undefined) ?? undefined,
            } satisfies TransactionRecord);
          },
          onerror: onError,
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  streamPayments: (publicKey, network, opts, onMessage, onError) =>
    Effect.try({
      try: () => {
        const server = horizonServer(network);
        let builder = server.payments().forAccount(publicKey);
        if (opts.cursor) builder = builder.cursor(opts.cursor);
        return builder.stream({
          onmessage: (raw: unknown) => {
            const op = raw as Record<string, unknown>;
            if (op.type !== "payment") return;
            onMessage({
              id: op.id as string,
              from: op.from as string,
              to: op.to as string,
              amount: op.amount as string,
              assetType: op.asset_type as string,
              assetCode: (op.asset_code as string | undefined) ?? undefined,
              assetIssuer: (op.asset_issuer as string | undefined) ?? undefined,
              transactionHash: op.transaction_hash as string,
              createdAt: op.created_at as string,
            } satisfies PaymentOperationRecord);
          },
          onerror: onError,
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),

  streamEffects: (publicKey, network, opts, onMessage, onError) =>
    Effect.try({
      try: () => {
        const server = horizonServer(network);
        let builder = server.effects().forAccount(publicKey);
        if (opts.cursor) builder = builder.cursor(opts.cursor);
        return builder.stream({
          onmessage: (raw: unknown) => {
            const record = raw as Record<string, unknown>;
            onMessage({
              id: record.id as string,
              account: record.account as string,
              type: record.type as string,
              createdAt: record.created_at as string,
            } satisfies EffectRecord);
          },
          onerror: onError,
        });
      },
      catch: (e: unknown) =>
        new HorizonError({ cause: e instanceof Error ? e.message : String(e) }),
    }),
});
