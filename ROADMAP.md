# Stecli Roadmap

## Current Focus

Build a solid Horizon API wrapper and complete the essential CLI commands. No skills, no MCP, no self-upgrade — just a clean, type-safe command surface that works.

### Running stecli

```bash
npx stecli <command>
bunx stecli <command>
```

No install, no upgrade command. Always runs the latest published version.

---

## What's Deferred

| Item                                    | Reason                                          | Revisit |
| --------------------------------------- | ----------------------------------------------- | ------- |
| Skills (`skills/` SKILL.md definitions) | Needs stable command surface first              | Phase 4 |
| MCP server (`stecli mcp`)               | Needs all commands and services finalized first | Phase 4 |
| Self-upgrade (`stecli upgrade`)         | `npx`/`bunx` handles this for free              | Never   |
| Soroban smart contract interaction      | Advanced feature, not essential for core loop   | Phase 4 |
| Website dashboard (`/dashboard` routes) | CLI is the priority                             | Phase 5 |
| Real OTP email delivery                 | Placeholder is fine for now                     | Phase 3 |

---

## What's Already Done

These items from the original Phase 1 are resolved:

- [x] API routes import from `#/db/index.ts` (not the missing `#/db/server.ts`)
- [x] `db/index.ts` exports a Drizzle client (`drizzle(env.NEON_DATABASE_URL)`)
- [x] Stale route files removed, `routeTree.gen.ts` regenerated with only existing routes
- [x] CLI services use `STECLI_API_URL` env var (fallback: `https://stecli.dev`)
- [x] Rebranding: `cent` → `stecli`, `centsh-agent` → `stecli`, `~/.cent/` → `~/.stecli/`
- [x] Error messages reference `stecli wallet login`

---

## Phase 1 — Fix & Harden Foundation

> Make the existing CLI and website actually work end-to-end, cleanly.

- [ ] Extract duplicate code from API routes:
  - `authenticate()` is duplicated in `wallet/index.ts` and `wallet/create.ts` → move to `apps/website/src/lib/auth.ts`
  - `decryptSecretKey()` is duplicated in `wallet/index.ts` and `wallet/create.ts` → move to `apps/website/src/lib/crypto.ts`
  - `encryptSecretKey()` is only in `wallet/create.ts` → also move to `apps/website/src/lib/crypto.ts`
- [ ] Make Horizon URLs configurable via env var (`STECLI_HORIZON_TESTNET_URL`, `STECLI_HORIZON_PUBNET_URL`) instead of hardcoded constants in `services/stellar.ts`
- [ ] Add a global `--network` flag (default: `testnet`) to the CLI root command, so every command can accept it without repeating the option
- [ ] Verify full E2E flow: `stecli wallet login` → `stecli wallet balance` → `stecli wallet transfer`

**Milestone:** Existing wallet commands work against a local dev server with no hardcoded URLs or duplicated logic.

---

## Phase 2 — Horizon API Wrapper + New Commands

> Wrap Horizon REST + SSE in typed services. Add the commands that make stecli genuinely useful.

### Services to add

| Service          | File                  | Methods                                                                                                                                                                                          |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HorizonService` | `services/horizon.ts` | `getAccountDetails`, `getTransactions`, `getPayments`, `getEffects`, `getAssets`, `getTradeAggregations`, `getOrderbook`, `getFeeStats`, `streamTransactions`, `streamPayments`, `streamEffects` |
| `AuditService`   | `services/audit.ts`   | `log(command, ok, duration, args)`, `rotate()`                                                                                                                                                   |

### New commands

| Command          | Subcommands                                      | What it does                                                     |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `stecli account` | `details`, `transactions`, `payments`, `effects` | Read account data from Horizon                                   |
| `stecli assets`  | `search`, `orderbook`                            | Look up assets, check markets                                    |
| `stecli send`    | —                                                | Send XLM or custom asset payment (generalizes `wallet transfer`) |
| `stecli fee`     | —                                                | Current fee stats from `/fee_stats`                              |
| `stecli monitor` | `transactions`, `payments`, `effects`            | Stream live data via SSE                                         |

### Types to add

New domain types in `domain/types.ts`:

- `AccountDetails`, `TransactionRecord`, `PaymentRecord`, `EffectRecord`
- `AssetRecord`, `OrderbookRecord`, `CandleRecord`, `FeeStats`
- `PaginationOpts`, `StreamEvent<T>`

New domain errors in `domain/errors.ts`:

- `HorizonError`, `AuditError`

### Command details

**`stecli account details <address>`**

- Calls `GET /accounts/:id`
- Output: balances, signers, thresholds, flags, subentry count, sequence number

**`stecli account transactions <address>`**

- Calls `GET /accounts/:id/transactions`
- Flags: `--limit`, `--cursor`, `--order asc|desc`
- Output: hash, ledger, created_at, operation_count, success

**`stecli account payments <address>`**

- Calls `GET /accounts/:id/payments`
- Flags: `--limit`, `--cursor`
- Output: id, from, to, amount, asset, transaction_hash

**`stecli account effects <address>`**

- Calls `GET /accounts/:id/effects`
- Flags: `--limit`, `--cursor`

**`stecli assets search [--code USDC] [--issuer G...]`**

- Calls `GET /assets`
- Flags: `--code`, `--issuer`, `--limit`

**`stecli assets orderbook --selling XLM --buying USDC:G...`**

- Calls `GET /order_book`
- Flags: `--selling`, `--buying`, `--limit`

**`stecli send <destination> <amount> [--asset native]`**

- Loads account, builds transaction, signs, submits via Horizon
- Asset format: `native` for XLM, `CODE:ISSUER` for custom assets
- `--memo text:...` flag for memo support
- Confirmation prompt for amounts > 100 XLM

**`stecli fee`**

- Calls `GET /fee_stats`
- Output: base_fee, min_fee, max_fee, ledger_capacity

**`stecli monitor transactions <address>`**

- Opens SSE stream, prints each transaction as it arrives
- `--cursor` to resume from a position
- Ctrl+C to stop

**`stecli monitor payments <address>`**

- Same pattern, streams payments

**`stecli monitor effects <address>`**

- Same pattern, streams effects

**Milestone:** All read-only Horizon commands + send payment work. `stecli account details GABC...` returns real data.

---

## Phase 3 — Polish & Shared SDK

> Extract reusable parts, add quality-of-life features, make everything production-ready.

- [x] ~~Extract `packages/sdk/` (`@stecli/sdk`)~~ — Kept simple, no extraction needed
- [x] Add `--format json|text` flag to all commands (default: json, text for human-readable tables)
- [x] Add `--network testnet|pubnet` global flag (default: testnet) — wired through the Effect layer
- [x] Add audit logging: `~/.stecli/audit.jsonl` with command, duration, redacted args
- [x] Add input validation with zod schemas for all command args
- [x] Better error messages: unfunded accounts, insufficient balance, network timeouts
- [x] Real OTP email delivery (Resend + React Email with DB-backed OTP codes)
- [x] Extract duplicate code from API routes: `authenticate()` → `lib/server/auth.ts`, `encryptSecretKey`/`decryptSecretKey` → `lib/server/crypto.ts`
- [ ] Integration tests against Horizon testnet

**Milestone:** Commands are stable, validated, and production-ready. No SDK package — keeping it simple.

---

## Phase 4 — Skills + MCP

> Layer on agent-friendly features now that the command surface is stable.

- [ ] Create `skills/` directory with SKILL.md definitions for each command group
- [ ] Add intent-routing trigger phrases to each skill's YAML frontmatter
- [ ] Implement `stecli mcp` command using `@modelcontextprotocol/sdk`
- [ ] Thin adapter: MCP tools call the same service functions as CLI commands
- [ ] Soroban contract interaction (deploy, simulate, invoke)
- [ ] Test MCP server with Claude Code, Cursor, OpenCode

---

## Phase 5 — Advanced

> DeFi, security, and dashboard.

- [ ] Liquidity pool operations (deposit, withdraw, swap)
- [ ] Claimable balance management
- [ ] Transaction simulation and pre-flight checks
- [ ] Path payment routing
- [ ] Website dashboard rebuild

---

## Priority Summary

```
Phase 1 (now)     → Fix remaining duplication, make Horizon URLs configurable, verify E2E
Phase 2 (next)    → Horizon wrapper + account/assets/send/fee/monitor commands
Phase 3            → @stecli/sdk extraction, audit, format flags, zod validation, real OTP
Phase 4            → Skills + MCP server + Soroban
Phase 5            → DeFi, dashboard
```

No upgrade command. `npx stecli` always runs latest.
