---
name: stelagent-cli
description: >
  Use this skill when the user wants to set up a Stellar wallet, log in, verify OTP,
  check wallet balance, send XLM or assets, make X402 payments, view wallet address,
  query account data, search assets, check fees, stream live events, start an MCP server,
  or any other interaction with the stelagent CLI for Stellar. Triggers on mentions of
  stelagent, Stellar wallet, X402 payments on Stellar, Stellar account queries, XLM transfers,
  Stellar testnet/pubnet operations, Horizon API queries, Stellar asset search, Stellar
  fee estimation, Stellar transaction history, Stellar payment history, Stellar streaming,
  or MCP server for Stellar.
metadata:
  author: stelagent
  version: "0.1.0"
  homepage: "https://stelagent.noval.me"
---

# Stelagent — Agent-First CLI for Stellar

Manage Stellar wallets, send payments, make X402 HTTP payments, query on-chain data, and expose everything via MCP — all from the terminal or through AI agent orchestration.

## Instruction Priority

This document uses tagged blocks to indicate rule severity. In case of conflict, higher priority wins:

1. **`<NEVER>`** — Absolute prohibition. Violation may cause irreversible fund loss. Never bypass.
2. **`<MUST>`** — Mandatory step. Skipping breaks functionality or safety.
3. **`<SHOULD>`** — Best practice. Follow when possible; deviation acceptable with reason.

## Pre-flight Checks

Before the first `stelagent` command this session, verify the CLI is available:

```bash
npx stelagent@latest --version
```

If not installed, inform the user: "stelagent is not installed. Run `npm install -g stelagent` or use `npx stelagent@latest` to run without installing."

> `npx stelagent@latest` and `bunx stelagent@latest` always resolve and run the latest published version. The `@latest` tag is recommended to ensure you never run a stale cached version. No separate upgrade command is needed.

## Network Selection

All commands accept `-n testnet|pubnet` (default: `testnet`).

- **testnet** — Horizon: `https://horizon-testnet.stellar.org`. Accounts auto-funded via Friendbot on wallet creation.
- **pubnet** — Horizon: `https://horizon-mainnet.stellar.org`. Real funds. Real consequences.

<MUST>
When the user says "mainnet", "production", or "real network", translate to `pubnet`. When uncertain, confirm with the user before using `pubnet`.
</MUST>

## Parameter Rules

### Public Key Format

Stellar public keys start with `G`, followed by 55 uppercase alphanumeric characters (Base 32): `G[A-Z2-7]{55}`.

- Validate before passing to any command.
- Display abbreviated as `GABCD...WXYZ` (first 8 + last 4).

### Asset Format

- **Native XLM**: use `native` or omit the asset flag (native is default).
- **Custom asset**: `CODE:ISSUER` (e.g., `USDC:GBTX...`). Code is 1–12 alphanumeric characters, issuer is a `G...` public key.

### Amount

- Numeric with up to 7 decimal places (Stellar precision).
- Always display in UI units (`1.5 XLM`, `100 USDC`).

## Command Index

> **CLI Reference**: For full parameter tables, return field schemas, and usage examples, see [cli-reference.md](references/cli-reference.md).

### A — Wallet Lifecycle

> Login commands (A1–A2) are covered in detail in **Authentication** below.

| #   | Command                                                      | Description                                 | Auth |
| --- | ------------------------------------------------------------ | ------------------------------------------- | ---- |
| A1  | `npx stelagent@latest wallet login -e <email>`               | Request OTP (sends code to email)           | No   |
| A2  | `npx stelagent@latest wallet verify -e <email> -o <code>`    | Verify OTP, create/recover wallet           | No   |
| A3  | `npx stelagent@latest wallet address`                        | Show public key, network, email (no secret) | Yes  |
| A4  | `npx stelagent@latest wallet balance`                        | Show all asset balances                     | Yes  |
| A5  | `npx stelagent@latest wallet transfer -t <addr> -a <amount>` | Send XLM                                    | Yes  |
| A6  | `npx stelagent@latest wallet logout`                         | Clear local session                         | Yes  |

### B — Payments

| #   | Command                                                          | Description                                  | Auth |
| --- | ---------------------------------------------------------------- | -------------------------------------------- | ---- |
| B1  | `npx stelagent@latest pay <url>`                                 | X402 micropayment (detects 402, signs, pays) | Yes  |
| B2  | `npx stelagent@latest send <addr> <amount> [-a asset] [-m memo]` | Send any asset (XLM or custom)               | Yes  |
| B3  | `npx stelagent@latest preflight <addr> <amount> [-a asset]`      | Validate a payment before sending            | Yes  |

### C — Account Queries (Public, No Auth)

| #   | Command                                            | Description                                        | Auth |
| --- | -------------------------------------------------- | -------------------------------------------------- | ---- |
| C1  | `npx stelagent@latest account details <addr>`      | Account info: balances, signers, thresholds, flags | No   |
| C2  | `npx stelagent@latest account transactions <addr>` | Transaction history                                | No   |
| C3  | `npx stelagent@latest account payments <addr>`     | Payment history                                    | No   |
| C4  | `npx stelagent@latest account effects <addr>`      | Effect history                                     | No   |

### D — Asset Queries (Public, No Auth)

| #   | Command                                                       | Description                   | Auth |
| --- | ------------------------------------------------------------- | ----------------------------- | ---- |
| D1  | `npx stelagent@latest assets search [-c code] [-i issuer]`    | Search assets by code/issuer  | No   |
| D2  | `npx stelagent@latest assets orderbook -s <asset> -b <asset>` | View orderbook for asset pair | No   |

### E — Network

| #   | Command                    | Description                         | Auth |
| --- | -------------------------- | ----------------------------------- | ---- |
| E1  | `npx stelagent@latest fee` | Current fee statistics from Horizon | No   |

### F — Streaming (SSE)

| #   | Command                                            | Description                      | Auth |
| --- | -------------------------------------------------- | -------------------------------- | ---- |
| F1  | `npx stelagent@latest monitor transactions <addr>` | Stream transactions in real-time | No   |
| F2  | `npx stelagent@latest monitor payments <addr>`     | Stream payments in real-time     | No   |
| F3  | `npx stelagent@latest monitor effects <addr>`      | Stream effects in real-time      | No   |

### G — MCP

| #   | Command                    | Description               | Auth |
| --- | -------------------------- | ------------------------- | ---- |
| G1  | `npx stelagent@latest mcp` | Start MCP server on stdio | No   |

All commands accept `-f json` (default) or `-f text`. Most accept `-n testnet|pubnet`. Account and asset commands support `--limit`, `--cursor`, `--order asc|desc`.

## Authentication

The login flow is always a two-step process:

1. **`wallet login`** — sends an OTP code to the user's email
2. **`wallet verify`** — verifies the code, creates the session, and creates/recoveries the wallet

This applies identically whether using the CLI directly or the MCP server — **CLI and MCP have 1:1 parity in functionality and behavior**.

### Step 1 — Request OTP

Ask the user for their email, then run:

```bash
npx stelagent@latest wallet login -e <email>
```

**Success:** `{ ok: true, data: { message: "OTP sent to user@example.com" } }`

Then tell the user:

> A verification code has been sent to **{email}**. Please check your inbox and tell me the code.

<NEVER>
Do NOT guess or fabricate OTP codes. Wait for the user to provide the code.
</NEVER>

### Step 2 — Verify OTP

Once the user provides the code, run:

```bash
npx stelagent@latest wallet verify -e <email> -o <code>
```

**Success:**

```json
{
  "ok": true,
  "data": {
    "wallet": {
      "email": "user@example.com",
      "publicKey": "GABCD...WXYZ",
      "network": "testnet",
      "createdAt": "2026-04-13T..."
    }
  }
}
```

After successful verification, show:

> Wallet ready! Your Stellar address is `GABCD...WXYZ` on testnet.

<NEVER>
Do NOT display the `secretKey` unless the user explicitly asks for it. The `wallet address` command exists to retrieve just the public key without exposing the secret.
</NEVER>

On testnet, the account is automatically funded via Friendbot.

### Check Login Status

```bash
npx stelagent@latest wallet address
```

- Logged in: `{ ok: true, data: { publicKey: "G...", network: "testnet", email: "..." } }`
- Not logged in: `{ ok: false, error: "No wallet found. Run stelagent wallet login first." }`

### Logout

```bash
npx stelagent@latest wallet logout
```

## Operation Flows

### Flow 1: First-Time Wallet Setup

> User: "Set up my Stellar wallet"

```
1. Ask email:       "What is your email address?"
2. Login:           npx stelagent@latest wallet login -e <email>
   ↓ "OTP sent to <email>"
3. Ask code:        "Check your inbox and tell me the code."
4. Verify:          npx stelagent@latest wallet verify -e <email> -o <code>
   ↓ { wallet: { publicKey, network, ... } }
5. Confirm:         "Wallet ready! Your address is GABCD...WXYZ on testnet."
```

### Flow 2: Check Balance and Send Payment

> User: "Send 10 XLM to GDXYZ..."

```
1. Check auth:       npx stelagent@latest wallet address
   ↓ if not logged in → Flow 1
2. Preflight:        npx stelagent@latest preflight GDXYZ... 10
   ↓ verify canProceed is true, review warnings
3. Check balance:    npx stelagent@latest wallet balance
   ↓ verify sufficient balance (include 1 XLM minimum reserve)
4. Send:             npx stelagent@latest send GDXYZ... 10
   ↓ returns { from, to, amount, asset, txHash }
5. Confirm:          "Sent 10 XLM to GDXYZ...WXYZ. Tx: <hash>"
```

<SHOULD>
Before sending, check the balance and warn if the remaining balance after the send would fall below the Stellar minimum account reserve (currently 1 XLM + 0.5 XLM per trustline/offer).
</SHOULD>

### Flow 3: Research Asset and Send Custom Asset

> User: "Send 100 USDC to GDXYZ..."

```
1. Search asset:     npx stelagent@latest assets search -c USDC
   ↓ verify asset exists, note issuer
2. Check auth:       npx stelagent@latest wallet address
   ↓ if not logged in → Flow 1
3. Preflight:        npx stelagent@latest preflight GDXYZ... 100 -a "USDC:GAXYZ..."
   ↓ verify canProceed is true
4. Send:             npx stelagent@latest send GDXYZ... 100 -a "USDC:GAXYZ..."
   ↓ returns { from, to, amount, asset, txHash, ledger }
5. Confirm:          "Sent 100 USDC to GDXYZ...WXYZ. Tx: <hash>"
```

### Flow 4: Full Account Review

> User: "Show me everything about my account"

```
1. Check auth:       npx stelagent@latest wallet address
   ↓ get publicKey
2. Account details:  npx stelagent@latest account details <publicKey>
   ↓ show balances, signers, thresholds, flags
3. Transactions:     npx stelagent@latest account transactions <publicKey> --limit 5
   ↓ show recent activity
4. Effects:          npx stelagent@latest account effects <publicKey> --limit 5
   ↓ show recent effects
```

### Flow 5: X402 Payment

> User: "Fetch https://api.example.com/premium — it needs payment"

```
1. Check auth:       npx stelagent@latest wallet address
   ↓ if not logged in → Flow 1
2. Pay:              npx stelagent@latest pay https://api.example.com/premium
   ↓ detects 402 → signs auth entries → re-fetches with payment
3. Result:           { url, status, paymentRequired: true, settlement, bodyPreview }
```

The X402 flow:

1. CLI fetches the URL. If status ≠ 402, returns response directly — **no payment needed**.
2. If status = 402, signs Soroban auth entries with the wallet's Ed25519 keypair.
3. Re-fetches with payment headers. Returns the paid content.

<IMPORTANT>
Do NOT check wallet status or attempt login before sending the initial request. Only proceed to payment if the response is HTTP 402.
</IMPORTANT>

### Flow 6: Monitor Account Activity

> User: "Watch for new transactions on GDXYZ..."

```
1. Stream:           npx stelagent@latest monitor transactions GDXYZ...
   ↓ SSE stream prints each transaction as it arrives
2. User presses Ctrl+C to stop
```

Monitor commands accept `--cursor` (default: `now`) to resume from a position.

### Flow 7: Asset Market Research

> User: "What's the USDC orderbook look like?"

```
1. Search:           npx stelagent@latest assets search -c USDC
   ↓ find the USDC asset and issuer
2. Orderbook:        npx stelagent@latest assets orderbook -s native -b "USDC:<issuer>"
   ↓ show bids and asks
3. Fee check:        npx stelagent@latest fee
   ↓ show current network fees
```

### Flow 8: Portfolio Check

> User: "What do I hold?"

```
1. Check auth:       npx stelagent@latest wallet address
2. Balance:          npx stelagent@latest wallet balance
   ↓ for each non-native asset:
3. Enrich:           npx stelagent@latest assets search -c <code>
   ↓ add market context
```

## MCP Server

The MCP server provides **1:1 parity** with the CLI — every CLI command has a corresponding MCP tool with identical behavior and output format. The only exception is `monitor` commands (SSE streaming doesn't fit request/response).

```bash
npx stelagent@latest mcp
```

### MCP Tool Surface (16 Tools)

| Category | Tool                   | CLI Equivalent          | Description                         | Auth |
| -------- | ---------------------- | ----------------------- | ----------------------------------- | ---- |
| Wallet   | `wallet_login`         | `wallet login -e`       | Request OTP to email                | No   |
| Wallet   | `wallet_verify`        | `wallet verify -e -o`   | Verify OTP, create session + wallet | No   |
| Wallet   | `wallet_address`       | `wallet address`        | Get public key, network, email      | Yes  |
| Wallet   | `wallet_balance`       | `wallet balance`        | Get all asset balances              | Yes  |
| Wallet   | `wallet_transfer`      | `wallet transfer -t -a` | Send XLM to another address         | Yes  |
| Wallet   | `wallet_logout`        | `wallet logout`         | Clear session                       | Yes  |
| Account  | `account_details`      | `account details`       | Full account info from Horizon      | No   |
| Account  | `account_transactions` | `account transactions`  | Transaction history                 | No   |
| Account  | `account_payments`     | `account payments`      | Payment history                     | No   |
| Account  | `account_effects`      | `account effects`       | Effect history                      | No   |
| Assets   | `assets_search`        | `assets search`         | Search assets by code/issuer        | No   |
| Assets   | `assets_orderbook`     | `assets orderbook`      | View orderbook for asset pair       | No   |
| Assets   | `fee_stats`            | `fee`                   | Current fee statistics              | No   |
| Payment  | `send_payment`         | `send`                  | Send any asset payment              | Yes  |
| Payment  | `pay_url`              | `pay`                   | X402 payment to a URL               | Yes  |
| Payment  | `preflight_check`      | `preflight`             | Validate a payment before sending   | Yes  |

### MCP Authentication Flow

MCP tools use the same two-step authentication as the CLI:

```
1. wallet_login({ email: "user@example.com" })
   → { ok: true, data: { message: "OTP sent to user@example.com" } }

2. Ask the user for the code, then:
   wallet_verify({ email: "user@example.com", otp: "123456", network: "testnet" })
   → { ok: true, data: { wallet: { email, publicKey, network, createdAt } } }
```

After `wallet_verify`, the session is saved to `~/.stelagent/session.json` and all authenticated tools work.

<NEVER>
Never fabricate, brute-force, or guess OTP codes. The agent must obtain the code from the user or a legitimate out-of-band mechanism.
</NEVER>

### MCP Client Configuration

**Claude Code** (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "stelagent": {
      "command": "npx",
      "args": ["stelagent@latest", "mcp"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stelagent": {
      "command": "npx",
      "args": ["stelagent@latest", "mcp"]
    }
  }
}
```

**OpenCode** (`.opencode.json`):

```json
{
  "mcp": {
    "stelagent": {
      "command": "npx",
      "args": ["stelagent@latest", "mcp"]
    }
  }
}
```

## Security Notes

<NEVER>
- **Never display `secretKey`** in conversation unless the user explicitly asks. Prefer `wallet address` to show only the public key.
- **Never send to unverified addresses on pubnet** without explicit user confirmation.
- **Never broadcast on pubnet without user confirmation** for amounts > 100 XLM or equivalent.
</NEVER>

<MUST>
- **Minimum balance**: Every Stellar account needs at least 1 XLM base reserve + 0.5 XLM per trustline, offer, or signer. Warn the user before sending if the remaining balance would fall below this threshold.
- **Unfunded accounts**: If an account doesn't exist on the network (Horizon 404), it needs at least 1 XLM to be activated. On testnet, wallet creation auto-funds via Friendbot.
- **Transaction irreversibility**: All Stellar transactions are irreversible once submitted. Inform the user before executing sends or transfers.
</MUST>

## Error Handling

All output follows `{ ok: true, data } | { ok: false, error: string }`.

| Error                                                  | Cause                            | Resolution                                                              |
| ------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| `"No wallet found. Run stelagent wallet login first."` | Not logged in or expired session | Run `npx stelagent@latest wallet login -e <email>` then `wallet verify` |
| `"Could not reach auth server."`                       | API unreachable                  | Check network, verify `STELAGENT_API_URL`                               |
| `"OTP verification failed."`                           | Wrong or expired code            | Run `npx stelagent@latest wallet login -e <email>` again                |
| `"Too many attempts"`                                  | 5+ wrong OTP guesses             | Request a new OTP                                                       |
| `"StellarAccountError"`                                | Account not found on network     | Fund testnet account via login (auto-funded)                            |
| `"InsufficientBalanceError"`                           | Not enough balance               | Fund the account or reduce amount                                       |
| `"UnfundedAccountError"`                               | Account not yet activated        | Send at least 1 XLM to activate it                                      |

## Environment Variables

| Variable                        | Default                               | Purpose                      |
| ------------------------------- | ------------------------------------- | ---------------------------- |
| `STELAGENT_API_URL`             | `https://stelagent.noval.me`          | API base URL for auth/wallet |
| `STELAGENT_HORIZON_TESTNET_URL` | `https://horizon-testnet.stellar.org` | Horizon testnet              |
| `STELAGENT_HORIZON_PUBNET_URL`  | `https://horizon-mainnet.stellar.org` | Horizon mainnet              |

## Audit Trail

All CLI commands are logged to `~/.stelagent/audit.jsonl` with timestamp, command, duration, and redacted arguments. This is enabled by default.

Format:

```json
{
  "ts": "2026-04-13T10:30:00.123Z",
  "source": "cli",
  "command": "account details",
  "ok": true,
  "duration_ms": 234,
  "args": ["stelagent", "account", "details", "--network", "testnet"]
}
```

Sensitive flags (`--secret`, `--email`, `--otp`, `--wallet`) have their values redacted to `[REDACTED]`.

## Edge Cases

> For detailed troubleshooting, see [troubleshooting.md](references/troubleshooting.md).

### Authentication

- **OTP expired**: Codes expire after a few minutes. Request a new one with `wallet login`.
- **Too many attempts**: 5+ wrong guesses locks the session. Request a new OTP.
- **API unreachable**: Check network and `STELAGENT_API_URL` env var.

### Send / Transfer

- **Insufficient balance**: Check balance first. Warn if remaining would fall below minimum reserve (1 XLM + 0.5 XLM per subentry).
- **Unfunded destination**: If the destination account doesn't exist, the transaction will fail. Inform the user.
- **Invalid asset format**: Custom assets must be `CODE:ISSUER`. If the format is wrong, the CLI returns a validation error.

### Account Queries

- **Unfunded account**: Horizon returns 404 for accounts that have never received XLM. The CLI translates this to `UnfundedAccountError`.
- **No transactions/payments/effects**: Return empty arrays. Display "No results found" — not an error.

### X402 Payment

- **Non-402 response**: Return the response directly. No payment was needed.
- **Payment failed (402 after signing)**: The server rejected the payment. Check `settlement` header for details.

### Monitor (SSE)

- **Connection drops**: The Horizon SSE stream may disconnect. The CLI handles reconnection internally.
- **Cursor usage**: Use `--cursor <id>` to resume from a specific event. Default `now` starts from new events only.

## Global Notes

<NEVER>
- Never show `secretKey` in conversation — use `wallet address` instead.
- Never execute pubnet sends without user confirmation for large amounts.
</NEVER>

<MUST>
- `npx stelagent@latest` / `bunx stelagent@latest` always resolves the latest published version — no upgrade command needed. Always use `@latest` to avoid stale cached versions.
- Transactions are irreversible — always inform the user before executing on pubnet.
- On testnet, accounts are auto-funded on wallet creation via Friendbot.
</MUST>

<SHOULD>
- Prefer `npx stelagent@latest wallet address` over other commands when only the public key is needed.
- When displaying public keys, abbreviate as `GABCD...WXYZ` (first 8 + last 4).
- After a successful send, suggest checking the updated balance.
- After a successful X402 payment, suggest verifying the payment in account history.
- For monitor commands, suggest using `--cursor` to resume from a known position.
</SHOULD>
