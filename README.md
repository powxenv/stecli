# Stelagent

**The agent-first CLI for Stellar.**

Wallet, payments, markets, monitoring — all structured as agent skills. Point any AI at Stelagent and it knows what to do.

## Quick start for AI agents

Paste this prompt into any AI agent (Claude Code, Cursor, OpenCode, OpenClaw, Hermes Agent, etc.) and chat naturally:

```
Read https://stelagent.noval.me/AGENTS.md, then set it up for me.
```

The agent reads the skill definition, handles wallet creation, OTP verification, and every Stellar operation on your behalf. No manual setup required.

### Install the skill manually

```bash
# Via flins (recommended) — works with Claude Code, Cursor, Windsurf, Copilot, and 20+ other agents
npx flins@latest add stelagent.noval.me

# Via skills.sh
npx skills add https://stelagent.noval.me
```

Both commands download the skill into your project's skills directory and wire it into your agent's configuration automatically.

### MCP integration

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

Once configured, the agent can perform any Stellar operation through 15 MCP tools — wallet login, balance checks, transfers, account queries, asset searches, x402 payments, and more.

## Install

```bash
npx stelagent@latest <command>
# or
bunx stelagent@latest <command>
```

No install needed — `npx` always runs the latest published version.

## What you can do

**Manage wallets** — Create a wallet with just an email. OTP-based auth, session persistence, secret keys never written to disk.

**Send payments** — Transfer XLM or any custom asset to any Stellar address. Add memos, check balances first, the agent handles the rest.

**Pay for APIs with x402** — Hit a paywalled endpoint and Stelagent negotiates the HTTP 402 flow automatically: signs the Soroban auth entry, retries with payment headers, returns the content.

**Query the chain** — Look up any account's details, transactions, payments, and effects via Horizon. Search assets and check order books.

**Stream live data** — Watch transactions, payments, and effects arrive in real-time via Horizon SSE.

**Plug into any agent** — The MCP server exposes all commands as tools over stdio. Claude Code, Cursor, OpenCode, or any MCP-compatible agent can use Stellar on your behalf.

## Command reference

### Wallet

```bash
npx stelagent@latest wallet login -e you@example.com        # Request OTP
npx stelagent@latest wallet verify -e you@example.com -o 123456  # Verify OTP
npx stelagent@latest wallet address                          # Show public key
npx stelagent@latest wallet balance                         # Check balances
npx stelagent@latest wallet transfer -t GDXXX... -a 10      # Send XLM
npx stelagent@latest wallet logout                          # Clear session
```

### Payments

```bash
npx stelagent@latest send GDXXX... 100 -a USDC:GAXYZ...            # Custom asset
npx stelagent@latest send GDXXX... 50 -a native --memo text:ref-99  # XLM with memo
npx stelagent@latest pay https://api.example.com/premium             # x402 payment
```

### Account queries

```bash
npx stelagent@latest account details GDXXX...        # Balances, signers, thresholds
npx stelagent@latest account transactions GDXXX...    # Transaction history
npx stelagent@latest account payments GDXXX...        # Payment history
npx stelagent@latest account effects GDXXX...         # Effect history
```

### Assets & fees

```bash
npx stelagent@latest assets search --code USDC                        # Search assets
npx stelagent@latest assets orderbook --selling XLM --buying USDC:G... # Order book
npx stelagent@latest fee                                              # Fee stats
```

### Streaming

```bash
npx stelagent@latest monitor transactions GDXXX...   # Stream transactions
npx stelagent@latest monitor payments GDXXX...        # Stream payments
npx stelagent@latest monitor effects GDXXX...         # Stream effects
```

### MCP server

```bash
npx stelagent@latest mcp   # Start MCP server on stdio
```

All commands accept `-n testnet|pubnet` (default: `testnet`) and `-f json|text` for output format. Account and asset queries support `--limit`, `--cursor`, and `--order asc|desc`.

## Agent workflows

### First-time wallet setup

```
User:  "Set up my Stellar wallet"
Agent: 1. npx stelagent@latest wallet login -e user@example.com
        → OTP sent to user@example.com
Agent: "Check your inbox and tell me the code."
User:  "123456"
Agent:  npx stelagent@latest wallet verify -e user@example.com -o 123456
        → Wallet ready. Address: GABCD...WXYZ on testnet.
```

### Check balance and send payment

```
User:  "Send 10 XLM to GDXYZ..."
Agent: 1. npx stelagent@latest wallet balance
        → Sufficient balance confirmed
Agent: 2. npx stelagent@latest send GDXYZ... 10
        → Sent. Tx: <hash>
```

### Pay for an API

```
User:  "Fetch https://api.example.com/premium"
Agent: npx stelagent@latest pay https://api.example.com/premium
       → Detects 402, signs payment, returns content
```

### Full account review

```
User:  "Show me everything about my account"
Agent: 1. npx stelagent@latest wallet address
Agent: 2. npx stelagent@latest account details <address>
Agent: 3. npx stelagent@latest account transactions <address> --limit 5
Agent: 4. npx stelagent@latest account effects <address> --limit 5
```

### Asset research

```
User:  "What's the USDC orderbook look like?"
Agent: 1. npx stelagent@latest assets search --code USDC
Agent: 2. npx stelagent@latest assets orderbook -s native -b "USDC:<issuer>"
Agent: 3. npx stelagent@latest fee
```

## Authentication

Stelagent uses a two-step OTP flow:

1. **`wallet login -e <email>`** — sends a one-time code to your email
2. **`wallet verify -e <email> -o <code>`** — verifies the code and creates (or recovers) your wallet

The CLI stores a short-lived session token at `~/.stelagent/session.json`. Secret keys are fetched over HTTPS when needed and never written to disk. One email maps to one wallet, recoverable from any device.

## Networks

All commands default to **testnet**. Switch to mainnet with `-n pubnet`:

```bash
npx stelagent@latest wallet balance -n pubnet
```

Or set `STELAGENT_NETWORK=pubnet` in your environment.

Testnet accounts are auto-funded via Friendbot on wallet creation. Pubnet uses real funds — always confirm before sending.

## Output format

All commands return consistent JSON:

```json
{ "ok": true, "data": { ... } }
```

```json
{ "ok": false, "error": "insufficient_balance" }
```

Use `--format text` for human-readable output.

## Audit log

Every command is logged to `~/.stelagent/audit.jsonl` with timestamp, command, duration, and redacted args. Disable with `STELAGENT_NO_AUDIT=1`.

## Environment variables

| Variable                        | Default                               | Purpose                             |
| ------------------------------- | ------------------------------------- | ----------------------------------- |
| `STELAGENT_API_URL`             | `https://stelagent.noval.me`          | Auth and wallet API                 |
| `STELAGENT_HORIZON_TESTNET_URL` | `https://horizon-testnet.stellar.org` | Horizon testnet                     |
| `STELAGENT_HORIZON_PUBNET_URL`  | `https://horizon-mainnet.stellar.org` | Horizon mainnet                     |
| `STELAGENT_NETWORK`             | `testnet`                             | Default network                     |
| `STELAGENT_NO_AUDIT`            | —                                     | Set to `1` to disable audit logging |

## Common errors

| Error                  | Cause                              | Fix                        |
| ---------------------- | ---------------------------------- | -------------------------- |
| `AUTH_REQUIRED`        | No session                         | `wallet login -e <email>`  |
| `INSUFFICIENT_BALANCE` | Not enough for payment + fees      | Fund the account           |
| `ACCOUNT_NOT_FOUND`    | Destination doesn't exist on-chain | Verify the address         |
| `TX_TOO_OLD`           | Transaction expired                | Retry (usually clock sync) |
| `HORIZON_ERROR 400`    | Horizon rejected the request       | Check the error message    |

## MCP tool surface

The MCP server exposes 15 tools with 1:1 parity to the CLI. Stream commands (`monitor`) are the only exception — SSE doesn't fit the request/response model.

| Category | Tool                   | CLI equivalent          | Auth |
| -------- | ---------------------- | ----------------------- | ---- |
| Wallet   | `wallet_login`         | `wallet login -e`       | No   |
| Wallet   | `wallet_verify`        | `wallet verify -e -o`   | No   |
| Wallet   | `wallet_address`       | `wallet address`        | Yes  |
| Wallet   | `wallet_balance`       | `wallet balance`        | Yes  |
| Wallet   | `wallet_transfer`      | `wallet transfer -t -a` | Yes  |
| Wallet   | `wallet_logout`        | `wallet logout`         | Yes  |
| Account  | `account_details`      | `account details`       | No   |
| Account  | `account_transactions` | `account transactions`  | No   |
| Account  | `account_payments`     | `account payments`      | No   |
| Account  | `account_effects`      | `account effects`       | No   |
| Assets   | `assets_search`        | `assets search`         | No   |
| Assets   | `assets_orderbook`     | `assets orderbook`      | No   |
| Network  | `fee_stats`            | `fee`                   | No   |
| Payment  | `send_payment`         | `send`                  | Yes  |
| Payment  | `pay_url`              | `pay`                   | Yes  |

## Security

- Secret keys are fetched over HTTPS and never written to disk
- `wallet address` shows only the public key — secret keys are never displayed
- Always confirm before sending on pubnet
- Warn before sending if the remaining balance would fall below the Stellar minimum reserve (1 XLM + 0.5 XLM per trustline/offer/signer)
- All Stellar transactions are irreversible once submitted

## Roadmap

- **Liquidity pool operations** — deposit, withdraw, swap
- **Soroban smart contracts** — deploy, simulate, invoke
- **Path payment routing** — multi-hop FX between assets
- **Claimable balances** — create and claim with custom schedules
- **Transaction simulation** — preview before signing
- **Pre-flight checks** — fee estimation, balance validation
- **Confirmation prompts** — explicit confirmation for high-value transfers
- **Integration tests** — runnable suite against Horizon testnet
- **Webhook notifications** — push alerts on incoming payments

## Contributing

```bash
vp install
vp run ready
```

```bash
vp run dev        # Dev server
vp check          # Format, lint, type-check
vp test           # Run tests
```
