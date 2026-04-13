# Stecli Architecture Proposal

> Modular, agent-first CLI for Stellar — combining OnchainOS's skill-based design with Stellar's Horizon ecosystem.

---

## 1. Rebranding Summary

All `cent` / `centsh` / `centsh-agent` references have been updated to `stecli` / `@stecli/cli`:

| Location            | Before                                              | After                                                                        |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Root `package.json` | `"name": "cent"`                                    | `"name": "stecli"`                                                           |
| CLI `package.json`  | `@centsh/agent`                                     | `@stecli/cli`                                                                |
| CLI bin name        | `centsh-agent`                                      | `stecli`                                                                     |
| CLI meta name       | `centsh-agent`                                      | `stecli`                                                                     |
| CLI description     | "Agentic wallet CLI for Stellar with x402 payments" | "Modular, agent-first CLI for Stellar — wallet, payments, markets, and DeFi" |
| Session dir         | `~/.cent/`                                          | `~/.stecli/`                                                                 |
| API base URL        | hardcoded `https://cent.dev`                        | `STECLI_API_URL` env var / `https://stecli.dev`                              |
| Error messages      | `@centsh/agent wallet login`                        | `stecli wallet login`                                                        |
| Website title       | "Cent — Sell Digital Products with Micropayments"   | "Stecli — Agent-First CLI for Stellar"                                       |
| Root README         | Vite+ starter boilerplate                           | stecli project description                                                   |

---

## 2. OnchainOS Architecture Analysis

### 2.1 Skill System

OnchainOS ships **14 skills**, each defined as a `SKILL.md` with YAML frontmatter:

```yaml
---
name: okx-dex-swap
description: "Use this skill to 'swap tokens', 'trade OKB for USDC', ..."
license: MIT
metadata:
  author: okx
  version: "2.2.8"
  homepage: "https://web3.okx.com"
---
```

The `description` field contains **extensive trigger phrases** in English and Chinese for LLM-based intent matching. Each skill includes:

1. **Command Index** — Table of CLI commands with descriptions
2. **Pre-flight Checks** — Version check, binary integrity, install/update flow
3. **Chain Name Support** — Human-readable chain names mapped to chainIndex IDs
4. **Operation Flow** — Step-by-step instructions for each use case
5. **Skill Routing** — Links to other skills for cross-domain tasks
6. **Safety/Risk Controls** — BLOCK / WARN / PROCEED decision matrix
7. **Edge Cases** — Error codes, region restrictions, special tokens
8. **Amount Display Rules** — Human-readable units, USD formatting

### 2.2 CLI Architecture (Rust)

```
cli/src/
├── main.rs                  # Entry point, clap parser, command dispatcher
├── audit.rs                 # Audit logging (~/.onchainos/audit.jsonl)
├── chains.rs                # Chain name → chainIndex resolution
├── client.rs                # HTTP API client (3 auth modes)
├── config.rs                # AppConfig loader (~/.onchainos/config.json)
├── crypto.rs                # HPKE, X25519 for x402 signing
├── file_keyring.rs          # Encrypted file keyring fallback (AES-256-GCM)
├── home.rs                  # Path resolution
├── keyring_store.rs         # Unified keyring (OS + file fallback)
├── output.rs                # Structured JSON output
├── wallet_api.rs            # Agentic wallet HTTP client
├── wallet_store.rs          # Session persistence
├── mcp/
│   └── mod.rs               # MCP server (rmcp, 50+ tools)
├── watch/
│   ├── daemon.rs            # WebSocket daemon process
│   ├── mod.rs               # WebSocket manager
│   ├── store.rs             # Subscription store
│   └── types.rs             # WS message types
└── commands/
    ├── mod.rs               # Context struct (config + overrides)
    ├── agentic_wallet/       # Wallet sub-commands
    ├── defi.rs              # DeFi commands
    ├── gateway.rs           # On-chain gateway
    ├── leaderboard.rs       # Top trader leaderboard
    ├── market.rs            # Market data
    ├── memepump.rs           # Meme token scanning
    ├── portfolio.rs          # Wallet portfolio
    ├── security.rs           # Security scanning
    ├── signal.rs             # Smart money signals
    ├── swap.rs               # DEX swap
    ├── token.rs              # Token info
    ├── tracker.rs            # Address tracker
    ├── upgrade.rs            # Self-upgrade
    └── ws.rs                # WebSocket subscribe/poll/stop/list
```

**Top-level commands:**

```
onchainos market|signal|memepump|leaderboard|token|swap|gateway|
           portfolio|mcp|wallet|security|payment|tracker|ws|defi|upgrade
```

### 2.3 Authentication

Three auth modes resolved automatically:

| Mode          | When Used                 | Headers                                         |
| ------------- | ------------------------- | ----------------------------------------------- |
| **JWT**       | User logged in via wallet | `Authorization: Bearer <token>`                 |
| **AK (HMAC)** | Env vars set              | `OK-ACCESS-KEY`, `OK-ACCESS-SIGN` (HMAC-SHA256) |
| **Anonymous** | No credentials            | `ok-client-version: <version>`                  |

Priority: JWT (not expired) → JWT refresh → AK → Anonymous.

### 2.4 Output Format

```json
{ "ok": true, "data": ... }       // success
{ "ok": false, "error": "..." }   // failure
{ "confirming": true, "message": "...", "next": "..." }  // needs confirmation
```

### 2.5 MCP Server

The MCP server is a **thin adapter** over stdio (JSON-RPC 2.0):

- `McpServer` struct with `ToolRouter<Self>`
- Each tool annotated with `#[tool(name = "...", description = "...")]`
- Parameters use `Parameters<T>` with JSON Schema
- Calls the same `fetch_*` functions as CLI commands → identical results
- 50+ tools across token, market, signal, swap, portfolio, gateway, defi categories

### 2.6 Key Design Patterns

1. **Dual auth**: Public APIs (HMAC/anonymous) vs Agentic APIs (JWT)
2. **MCP as thin adapter**: Identical business logic between CLI and MCP
3. **Token address resolution**: Symbol → contract address mapping
4. **Skill intent routing**: Extensive trigger phrases in YAML frontmatter for LLM matching
5. **One-shot swap execute**: `approve → swap → sign → broadcast` orchestrated automatically
6. **Audit logging**: JSONL with redaction of sensitive flags
7. **Encrypted keyring**: OS native (macOS/Windows) + AES-256-GCM file fallback (Linux)
8. **Self-upgrade**: Built-in `upgrade` command with semver comparison and SHA256 verification

---

## 3. Current Stecli (Formerly Cent) Analysis

### 3.1 What Exists

```
stecli/
├── apps/website/              # TanStack Start (SSR React + API routes)
│   └── src/
│       ├── db/
│       │   ├── schema.ts      # Drizzle schema: wallets + wallet_sessions
│       │   └── index.ts       # Neon JS client
│       ├── routes/
│       │   ├── __root.tsx
│       │   ├── index.tsx      # Landing page
│       │   └── api/cli/
│       │       ├── auth/otp/request.ts   # POST — send OTP
│       │       ├── auth/otp/verify.ts     # POST — verify OTP + create session
│       │       ├── wallet/create.ts      # POST — create wallet (Stellar Keypair + AES-GCM)
│       │       └── wallet/index.ts       # GET — fetch wallet
│       ├── router.tsx
│       ├── env.ts             # T3Env typed env vars
│       └── styles.css         # HeroUI theme (light/dark oklch)
├── packages/                  # EMPTY
├── packages/cli/                # @stecli/cli (was @centsh/agent)
│   └── src/
│       ├── index.ts            # Entry: citty + runMain
│       ├── domain/
│       │   ├── errors.ts       # 10 Effect-TS tagged error classes
│       │   └── types.ts       # Network, CommandResult, BalanceEntry, etc.
│       ├── layers/
│       │   └── app-layer.ts   # Effect Layer composition
│       ├── services/
│       │   ├── output.ts      # OutputService (JSON formatting)
│       │   ├── auth.ts        # AuthService (OTP request/verify)
│       │   ├── session.ts     # SessionService (~/.stecli/session.json)
│       │   ├── wallet-client.ts  # WalletClientService (HTTP)
│       │   ├── stellar.ts     # StellarService (Horizon balance + XLM transfer)
│       │   └── payment.ts     # PaymentService (x402 protocol)
│       └── commands/
│           ├── wallet.ts      # Wallet subcommand router
│           ├── wallet-login.ts
│           ├── wallet-address.ts
│           ├── wallet-balance.ts
│           ├── wallet-transfer.ts
│           ├── wallet-logout.ts
│           └── pay.ts
└── package.json               # Monorepo root ("stecli")
```

### 3.2 Functional Commands

| Command                                     | Status                | Description                              |
| ------------------------------------------- | --------------------- | ---------------------------------------- |
| `stecli wallet login -e <email>`            | Functional (mock OTP) | OTP-based login, creates/recovers wallet |
| `stecli wallet address`                     | Functional            | Show public key                          |
| `stecli wallet balance`                     | Functional            | XLM + asset balances via Horizon         |
| `stecli wallet transfer -t <addr> -a <amt>` | Functional            | Send XLM                                 |
| `stecli wallet logout`                      | Functional            | Clear session                            |
| `stecli pay <url>`                          | Functional            | x402 micropayment                        |

### 3.3 Critical Issues

1. **Missing `db/server.ts`** — API routes import `{ db, walletSessions, wallets }` from `#/db/server.ts`, but the file doesn't exist. Routes will crash at runtime. Need to create a Drizzle-compatible `db` instance wrapping the Neon client.
2. **Missing route files** — `routeTree.gen.ts` references `dashboard.tsx`, `dashboard.index.tsx`, `dashboard.projects.tsx`, `auth.index.tsx` which don't exist.
3. **Hashed credentials in git** — `.env` with Neon database URL was committed.
4. **OTP is a placeholder** — Any code ≥ 4 characters is accepted. No real email delivery.
5. **No shared packages** — `packages/` is empty; all code lives in-app.

### 3.4 Architecture Strengths

- **Effect-TS**: Clean service-oriented architecture with `Context.Tag`, `Layer`, and tagged errors
- **Structured output**: Consistent `{ ok, data }` / `{ ok, error }` JSON format
- **citty**: Well-structured CLI with subcommands
- **Type-safe env**: T3Env for runtime env validation
- **HeroUI + oklch**: Modern theming with light/dark modes

---

## 4. Gap Analysis: OnchainOS vs Current Stecli

| Dimension          | OnchainOS                                                 | Current Stecli                   | Gap Severity      |
| ------------------ | --------------------------------------------------------- | -------------------------------- | ----------------- |
| **Skills**         | 14 modular skill definitions (SKILL.md)                   | None                             | **Critical**      |
| **MCP Server**     | 50+ tools over JSON-RPC stdio                             | None                             | **Critical**      |
| **Commands**       | 15+ top-level commands                                    | 2 (wallet, pay)                  | **Major**         |
| **Auth**           | JWT + HMAC + anonymous, OS keyring + encrypted file       | Server OTP → Bearer token        | Moderate          |
| **Intent routing** | Trigger phrases in SKILL.md descriptions for LLM matching | None                             | **Major**         |
| **Streaming**      | WebSocket daemon for real-time data                       | None                             | **Major**         |
| **Audit logging**  | Full JSONL audit trail with redaction                     | None                             | Moderate          |
| **Auto-upgrade**   | Built-in self-upgrade with semver + SHA256                | None                             | Low               |
| **Output format**  | `{ ok, data }` / `{ ok, error }` / `{ confirming }`       | `{ ok, data }` / `{ ok, error }` | Aligned           |
| **Chains**         | 20+ blockchains                                           | Stellar only                     | N/A (intentional) |
| **DX install**     | `curl \| sh`, `npx skills add`                            | `npx @stecli/cli`                | Moderate          |

### Top Priority Gaps

1. **No skill system** — OnchainOS's SKILL.md format enables LLM-agent discovery and routing. We have nothing equivalent.
2. **No MCP server** — The biggest DX gap. OnchainOS doubles as an MCP server, making it instantly usable by Claude Code, Cursor, Codex, OpenCode.
3. **Minimal command surface** — Only wallet + pay. Missing: account insights, transactions, payments (non-x402), asset analytics, monitoring, DeFi.
4. **No intent routing** — Skills should declare trigger phrases so agents know _when_ to invoke them.
5. **No streaming/monitoring** — Horizon SSE is perfect for real-time watch commands.
6. **No audit trail** — No command history or redacted logging.

---

## 5. Stellar Horizon API Capabilities

### 5.1 Available Endpoints

| Resource               | Key Endpoints                                                            |
| ---------------------- | ------------------------------------------------------------------------ |
| **Accounts**           | `GET /accounts/:id` — balances, signers, flags, thresholds, data entries |
|                        | `GET /accounts/:id/transactions` — transaction history                   |
|                        | `GET /accounts/:id/payments` — payment history                           |
|                        | `GET /accounts/:id/effects` — all effects on account                     |
|                        | `GET /accounts/:id/offers` — open offers                                 |
|                        | `GET /accounts/:id/trades` — trade history                               |
| **Transactions**       | `GET /transactions` — list all                                           |
|                        | `GET /transactions/:id` — retrieve by hash                               |
|                        | `POST /transactions` — submit signed transaction                         |
|                        | `POST /transactions_async` — async submit                                |
| **Payments**           | `GET /payments` — all payment operations                                 |
| **Operations**         | `GET /operations` — all operations                                       |
|                        | `GET /operations/:id` — specific operation                               |
| **Assets**             | `GET /assets?asset_code=X&asset_issuer=Y` — filter by code/issuer        |
| **Ledgers**            | `GET /ledgers/:sequence` — ledger details                                |
| **Trades**             | `GET /trades` — all trades, filterable                                   |
| **Order Books**        | `GET /order_book` — bids/asks for asset pair                             |
| **Paths**              | `GET /paths` — find payment paths between assets                         |
| **Trade Aggregations** | `GET /trade_aggregations` — OHLCV candles                                |
| **Fee Stats**          | `GET /fee_stats` — current fee statistics                                |
| **Liquidity Pools**    | `GET /liquidity_pools` — LP list and details                             |
| **Claimable Balances** | `GET /claimable_balances` — filter by claimant/pool                      |

### 5.2 Streaming (SSE)

All collection endpoints support real-time streaming via `Accept: text/event-stream`:

- Transactions, payments, operations, effects, ledgers, trades, order books
- Cursor-based resumption prevents data gaps
- ~5 second ledger close time

### 5.3 Authentication

Horizon requires **no authentication** — it's a public read-only REST API. Transaction submission requires client-side cryptographic signing.

### 5.4 Rate Limits

- 3,600 requests/hour/IP (default on SDF-hosted Horizon)
- Self-hosted Horizon can configure `PER_HOUR_RATE_LIMIT`
- Each SSE event counts against the rate limit
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 5.5 Soroban (Smart Contracts)

- Separate RPC: `soroban-testnet.stellar.org` / `soroban.stellar.org`
- Deploy, simulate, invoke WASM smart contracts
- TypeScript SDK: `@stellar/stellar-sdk` with `rpc.Server` class
- Contract client generation: `npx @stellar/stellar-sdk generate`

### 5.6 x402 on Stellar

- HTTP 402 protocol for per-request micropayments
- Agent → paid API → 402 → sign Soroban auth entry → facilitator settles
- NPM: `@x402/core` + `@x402/stellar`
- ~5 second finality, near-zero fees

### 5.7 Existing Stellar Agent Tools

| Tool                                | Description                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| StellarMCP (`@ggoldani/stellarmcp`) | MCP server for Stellar: accounts, payments, XDR, Horizon/Soroban RPC |
| stellar-mcp (JoseCToscano)          | Generates MCP servers from deployed Soroban contracts                |
| Stellar Agent Kit                   | Unified TS SDK + CLI agent + MCP server + x402                       |

---

## 6. Proposed Architecture: Stecli v2

### 6.1 Directory Structure

```
stecli/
├── apps/
│   └── website/                     # TanStack Start (API server + dashboard)
├── skills/                           # Agent skill definitions (SKILL.md)
│   ├── stellar-wallet/              # Wallet lifecycle: login, address, balance, transfer
│   │   └── SKILL.md
│   ├── stellar-pay/                 # Payments: x402, standard, path payments
│   │   └── SKILL.md
│   ├── stellar-account/             # Account insights: details, history, effects, data
│   │   └── SKILL.md
│   ├── stellar-assets/              # Asset analytics: search, info, holders, markets
│   │   └── SKILL.md
│   ├── stellar-monitor/             # Real-time SSE monitoring
│   │   └── SKILL.md
│   ├── stellar-defi/                # DeFi: liquidity pools, AMM, Soroban contracts
│   │   └── SKILL.md
│   └── stellar-security/            # Security: transaction simulation, fee estimation
│       └── SKILL.md
├── packages/
│   └── sdk/                         # @stecli/sdk — shared Stellar service library
│       ├── src/
│       │   ├── horizon.ts            # Horizon REST + SSE client
│       │   ├── soroban.ts            # Soroban RPC client
│       │   ├── wallet.ts             # Wallet key management, signing
│       │   ├── payment.ts            # x402 + standard payment flows
│       │   └── types.ts              # Shared types
│       └── package.json
├── packages/
│   ├── cli/                         # @stecli/cli — the CLI binary
│   │   ├── src/
│       │   ├── index.ts              # Entry: defineCommand + runMain
│       │   ├── domain/
│       │   │   ├── errors.ts         # Tagged error classes
│       │   │   └── types.ts          # Shared types
│       │   ├── layers/
│       │   │   └── app-layer.ts      # Effect Layer composition
│       │   ├── services/
│       │   │   ├── output.ts         # OutputService (JSON formatting)
│       │   │   ├── auth.ts           # AuthService (OTP / API key)
│       │   │   ├── session.ts        # SessionService (~/.stecli/)
│       │   │   ├── wallet-client.ts  # WalletClientService (HTTP)
│       │   │   ├── horizon.ts        # HorizonService (REST + SSE)
│       │   │   ├── soroban.ts        # SorobanService (contract calls)
│       │   │   ├── payment.ts        # PaymentService (x402)
│       │   │   └── audit.ts          # AuditService (JSONL logging)
│       │   ├── commands/
│       │   │   ├── wallet.ts         # wallet (login, address, balance, transfer, logout)
│       │   │   ├── account.ts        # account (details, transactions, payments, effects, data)
│       │   │   ├── assets.ts         # assets (search, info, holders, markets, orderbook)
│       │   │   ├── pay.ts            # pay <url> (x402)
│       │   │   ├── send.ts           # send <address> <amount> [asset] (standard payment)
│       │   │   ├── monitor.ts        # monitor (transactions, payments, effects)
│       │   │   ├── mcp.ts            # mcp (start MCP server on stdio)
│       │   │   └── upgrade.ts        # upgrade (self-update)
│       │   └── mcp/
│       │       ├── mod.ts            # McpServer + tool router
│       │       ├── wallet-tools.ts
│       │       ├── account-tools.ts
│       │       ├── asset-tools.ts
│       │       ├── payment-tools.ts
│       │       └── monitor-tools.ts
│       └── package.json
├── AGENTS.md
├── package.json
└── README.md
```

### 6.2 Command Surface

| Command          | Subcommands                                    | Description                 | Horizon Endpoints                                   |
| ---------------- | ---------------------------------------------- | --------------------------- | --------------------------------------------------- |
| `stecli wallet`  | login, address, balance, transfer, logout      | Wallet lifecycle            | `POST /transactions`                                |
| `stecli account` | details, transactions, payments, effects, data | Account insights            | `GET /accounts/:id/*`                               |
| `stecli assets`  | search, info, holders, markets, orderbook      | Asset analytics             | `GET /assets`, `/order_book`, `/trade_aggregations` |
| `stecli send`    | —                                              | Send payment (XLM or asset) | `POST /transactions`                                |
| `stecli pay`     | —                                              | x402 micropayment to URL    | N/A (x402 protocol)                                 |
| `stecli monitor` | transactions, payments, effects, account       | SSE real-time streaming     | `GET /transactions` etc. w/ SSE                     |
| `stecli mcp`     | —                                              | Start MCP server (stdio)    | All of the above                                    |
| `stecli upgrade` | —                                              | Self-update CLI binary      | N/A                                                 |

### 6.3 Skill Definition (SKILL.md) Format

Each skill follows the OnchainOS pattern with Stellar-specific content:

```yaml
---
name: stellar-account
description: >
  Account insights on Stellar. Use this skill when the user asks about
  'account info', 'account details', 'transaction history', 'payment history',
  'effects', 'account data', 'signers', 'thresholds', 'what happened on chain',
  'Stellar account balance', 'show my account'.
  Trigger phrases: "check account", "account details", "what happened",
  "transaction history", "recent payments", "account data entries"
metadata:
  author: stecli
  version: "0.1.0"
  homepage: "https://stecli.dev"
---
```

Each SKILL.md includes:

1. **Command Index** — Table of `stecli` commands with descriptions and flags
2. **Pre-flight Checks** — Session validation, network selection
3. **Network Selection** — `--network testnet|pubnet` (default: testnet)
4. **Operation Flow** — Step-by-step instructions per use case
5. **Skill Routing** — Links to related skills for cross-domain flows
6. **Safety Controls** — Confirmation prompts for send/transfer, fee warnings
7. **Edge Cases** — Unfunded accounts, minimum balance, reserve requirements
8. **Cross-skill Workflows** —

```
Search and Buy:  stellar-assets (find asset) → stellar-account (check balance) → stecli send (execute payment)
Portfolio Check:  stellar-account (account details) → stellar-assets (enrich with market data)
Monitor Activity:  stellar-monitor (stream SSE) → stellar-account (enrich effects)
x402 Payment:  stecli pay (detect 402 → sign → settle) → stellar-account (verify payment)
```

### 6.4 MCP Server Implementation

The MCP server exposes all CLI capabilities as tools over stdio (JSON-RPC 2.0):

```typescript
// packages/cli/src/mcp/mod.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export function startMcpServer(): void {
  const server = new McpServer({
    name: "stecli",
    version: "0.1.0",
  });

  // Wallet tools
  registerWalletTools(server);
  registerAccountTools(server);
  registerAssetTools(server);
  registerPaymentTools(server);
  registerMonitorTools(server);

  const transport = new StdioServerTransport();
  server.connect(transport);
}
```

**Tool surface (25+ tools):**

| Category    | Tools                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------ |
| **Wallet**  | `wallet_login`, `wallet_address`, `wallet_balance`, `wallet_transfer`                            |
| **Account** | `account_details`, `account_transactions`, `account_payments`, `account_effects`, `account_data` |
| **Assets**  | `asset_search`, `asset_info`, `asset_holders`, `asset_markets`, `asset_orderbook`                |
| **Payment** | `pay_url`, `send_payment`, `send_asset_payment`                                                  |
| **Monitor** | `monitor_transactions`, `monitor_payments`, `monitor_effects`, `monitor_account`                 |
| **DeFi**    | `liquidity_pools`, `liquidity_pool_details`, `find_paths`                                        |

Each tool:

- Accepts JSON Schema parameters (with `--network` defaulting to `testnet`)
- Calls the same service functions as CLI commands (DRY)
- Returns structured JSON: `{ ok: true, data }` or `{ ok: false, error }`

### 6.5 Service Layer (Effect-TS)

The current Effect-TS service pattern continues, expanded:

```typescript
// services/horizon.ts
export class HorizonService extends Context.Tag("HorizonService")<
  HorizonService,
  {
    readonly getAccountDetails: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<AccountDetails, HorizonError>;
    readonly getTransactions: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<Transaction>, HorizonError>;
    readonly getPayments: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<Payment>, HorizonError>;
    readonly getEffects: (
      publicKey: string,
      network: Network,
      opts?: PaginationOpts,
    ) => Effect.Effect<ReadonlyArray<Effect>, HorizonError>;
    readonly getAssets: (
      opts?: AssetFilterOpts,
    ) => Effect.Effect<ReadonlyArray<AssetInfo>, HorizonError>;
    readonly getOrderbook: (
      selling: Asset,
      buying: Asset,
      network: Network,
    ) => Effect.Effect<Orderbook, HorizonError>;
    readonly getTradeAggregations: (
      opts: TradeAggregationOpts,
    ) => Effect.Effect<ReadonlyArray<Candle>, HorizonError>;
    readonly streamTransactions: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<Stream<Transaction>, HorizonError>;
    readonly streamPayments: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<Stream<Payment>, HorizonError>;
    readonly streamEffects: (
      publicKey: string,
      network: Network,
    ) => Effect.Effect<Stream<Effect>, HorizonError>;
  }
>() {}
```

### 6.6 Audit Logging

Following the OnchainOS pattern:

```
~/.stecli/audit.jsonl
{"ts":"2026-04-13T10:30:00.123Z","source":"cli","command":"account details","ok":true,"duration_ms":234,"args":["stecli","account","details","--network","testnet"]}
```

- Source: `cli` or `mcp`
- Sensitive flags redacted: `--secret`, `--wallet`, `--email`
- Rotation: keep most recent 5,000 lines when file exceeds 10,000
- Enabled by default, opt-out via `STECLI_NO_AUDIT=1`

### 6.7 Auth Model (Proposed)

Layered auth following OnchainOS's approach:

| Mode               | When Used                                | Storage                            |
| ------------------ | ---------------------------------------- | ---------------------------------- |
| **Server session** | User logged in via `stecli wallet login` | `~/.stecli/session.json` (current) |
| **API key**        | Env vars `STECLI_API_KEY`                | Not persisted                      |
| **Anonymous**      | No credentials                           | N/A                                |

Priority: Existing session → API key env var → Anonymous (read-only Horizon data).

### 6.8 Self-Upgrade

Following OnchainOS's pattern:

```bash
stecli upgrade              # check and install latest stable
stecli upgrade --beta       # include pre-releases
```

- Check GitHub releases API for latest version
- SHA256 checksum verification
- Auto PATH setup
- 12-hour cache to avoid rate limiting

---

## 7. What to Build on Stellar

Based on the Horizon API analysis, these are the high-value capabilities for stecli:

### 7.1 Wallet Insights (Current — Enhanced)

- Account details: balances, signers, flags, thresholds, data entries
- Full transaction/payment/effect history with pagination
- Reserve requirements and minimum balance calculations

### 7.2 Payment Flows

- Standard payments: XLM and custom assets via `Operation.payment`
- Path payments: Multi-hop FX via `Operation.pathPaymentStrictSend`
- x402 micropayments: Agent-to-agent HTTP 402 protocol (current `stecli pay`)
- Claimable balances: Create, claim, filter by claimant

### 7.3 Account Monitoring

- SSE streaming on all collection endpoints
- Watch transactions, payments, effects in real-time
- Cursor-based resume to prevent data gaps after disconnection

### 7.4 Asset / Token Analytics

- Search assets by code and issuer
- Order book depth for any trading pair
- Trade aggregations (OHLCV candles) for charting
- Liquidity pool analytics

### 7.5 Transaction Lifecycle

- Build → sign → simulate (Soroban) → broadcast → track
- Fee estimation from `/fee_stats`
- Transaction simulation before broadcast
- Async transaction submission for high-throughput scenarios

### 7.6 DeFi / Soroban

- Deploy and invoke Soroban smart contracts
- AMM and liquidity pool operations
- Contract client generation from WASM

### 7.7 Security

- Transaction simulation and pre-flight checks
- Fee estimation and warning thresholds
- Confirmation prompts for send/transfer operations

---

## 8. Cross-Skill Workflows

Following OnchainOS's pattern of composing skills into flows:

**Check Balance and Send:**

```
stecli wallet balance → stecli account details → stecli send
```

**Research Asset and Trade:**

```
stecli assets search USDC → stecli assets orderbook → stecli send (path payment)
```

**Monitor Activity:**

```
stecli monitor transactions → stecli account effects → stecli account payments
```

**x402 Payment Flow:**

```
stecli pay <url> → (402 response) → sign Soroban auth → settle → stecli account payments (verify)
```

**Full Portfolio Review:**

```
stecli wallet balance → stecli account details → stecli assets info (per asset)
```

---

## 9. Implementation Priority

| Phase                    | Deliverables                                                                                                       | Timeline |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------- |
| **P0 — Foundation**      | Fix `db/server.ts`, add `@stecli/sdk` package, add `account` command, add `audit` service                          | Week 1   |
| **P1 — Core Skills**     | Skill definitions (stellar-wallet, stellar-account, stellar-pay, stellar-assets), `send` command, `assets` command | Week 2   |
| **P2 — MCP + Streaming** | MCP server with 25+ tools, `monitor` command with SSE streaming                                                    | Week 3   |
| **P3 — Advanced**        | Soroban contract interaction, `defi` commands, `security` commands, self-upgrade                                   | Week 4   |

---

## 10. Unresolved Questions

1. **Auth model**: Keep server-side wallets (current) or add local key management like OnchainOS (keyring + encrypted file)?
2. **SDK extraction**: Should `@stecli/sdk` be published as a standalone package for other projects to use?
3. **MCP implementation**: Use `@modelcontextprotocol/sdk` (TypeScript) or build a thin custom adapter?
4. **Dashboard**: Should the website dashboard (`/dashboard` routes) be rebuilt, or is CLI-only the priority?
5. **SSE streaming**: Wrap Node.js EventSource in the Effect-TS streaming pattern, or use a different approach?
6. **Soroban priority**: Should smart contract interaction be P2 or P3?
