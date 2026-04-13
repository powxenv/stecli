# Stelagent

**The modular CLI for building on Stellar.**

Stelagent gives you a skill-based command architecture for interacting with the Stellar network — wallet management, x402 micropayments, Horizon API queries, and real-time monitoring all in one place.

If you're building an agent that needs to work with Stellar, or you just want a fast, scriptable way to move money, check balances, and pay for API access — this is your tool.

## What you can do with it

**Manage wallets** — Create a wallet with just an email, check balances across XLM and any custom assets, send payments to any Stellar address.

**Pay for things with x402** — Hit a paywalled API and Stelagent automatically handles the HTTP 402 negotiation, signs the Soroban auth entry, and settles the payment.

**Query the chain directly** — Look up any account's transaction history, payment history, effects, and asset details via Horizon. No middleman.

**Stream live data** — Watch an account's transactions, payments, or effects arrive in real-time via Horizon's SSE endpoint.

**Plug into any AI agent** — The MCP server exposes all commands as tools over stdio, so Claude Code, Cursor, or any MCP-compatible agent can use Stellar on your behalf.

## Install

```bash
npx stelagent@latest <command>
# or
bunx stelagent@latest <command>
```

No install needed — `npx` always runs the latest published version.

## Getting started

### 1. Create or recover your wallet

```bash
npx stelagent@latest wallet login -e you@example.com
```

Stelagent sends a one-time passcode to your email. Enter it when prompted and your wallet is created (or recovered if you've used this email before). The same wallet is accessible from any device.

By default, everything runs on **testnet**. When you're ready for mainnet, add `-n pubnet`:

```bash
npx stelagent@latest wallet login -e you@example.com -n pubnet
```

### 2. Check your address and balance

```bash
npx stelagent@latest wallet address
# → {"ok": true, "data": {"address": "GDXXX..."}}

npx stelagent@latest wallet balance
# → {"ok": true, "data": {"balances": [{"asset": "native", "balance": "10000.0000000"}]}}
```

### 3. Send a payment

```bash
npx stelagent@latest wallet transfer -t GDYYY... -a 5
```

This sends 5 XLM. For custom assets, use `send` with the asset code and issuer:

```bash
npx stelagent@latest send GDZZZ... 100 -a USDC:GAXYZ...
```

Asset format: `native` for XLM, or `CODE:ISSUER` for anything else (e.g., `USDC:GAXYZ...`).

Add a memo if the recipient requires one:

```bash
npx stelagent@latest send GDZZZ... 50 -a native --memo text:invoice-12345
```

### 4. Pay for an API with x402

```bash
npx stelagent@latest pay https://api.example.com/premium
```

If the API returns HTTP 402, Stelagent negotiates the payment using the x402 protocol — it signs the Soroban auth entry and retries the request with payment headers. You get the resource, the facilitator settles on-chain. Done.

## Everyday workflows

### Check your full account picture

```bash
# Account details: balances, signers, flags, thresholds
npx stelagent@latest account details GDXXX...

# Recent transactions
npx stelagent@latest account transactions GDXXX...

# Recent payments
npx stelagent@latest account payments GDXXX...

# Everything that happened to the account
npx stelagent@latest account effects GDXXX...
```

All support `--limit` and `--cursor` for pagination, and `--order asc|desc` for ordering.

### Look up any asset

```bash
# Search assets by code and issuer
npx stelagent@latest assets search --code USDC --issuer GXXX...

# Check order book depth for a trading pair
npx stelagent@latest assets orderbook --selling XLM --buying USDC:GYYY...
```

### Watch an account in real-time

```bash
# Stream new transactions as they land
npx stelagent@latest monitor transactions GDXXX...

# Stream payments
npx stelagent@latest monitor payments GDXXX...

# Stream all effects
npx stelagent@latest monitor effects GDXXX...
```

Hit `Ctrl+C` to stop. Use `--cursor` to resume from a specific position.

### Check current fees

```bash
npx stelagent@latest fee
# → {"ok": true, "data": {"base_fee": 100, "min_fee": 100, "max_fee": 200, ...}}
```

## Using with AI agents (MCP)

Stelagent ships an MCP server that exposes all commands as tools. This lets any MCP-compatible AI agent interact with Stellar on your behalf.

Start the MCP server:

```bash
npx stelagent@latest mcp
```

In Claude Code, Cursor, Hermes Agent, OpenClaw, or OpenCode, the agent can then do things like:

- "Check my wallet balance"
- "Send 10 XLM to this address"
- "Look up the last 5 transactions on my account"
- "Monitor incoming payments to my address"

All without you touching the CLI — the agent reads the skill definitions, picks the right tool, and executes.

## How it works

### Wallet security

Wallets are stored server-side. One email maps to one wallet, recoverable from any device with the same login flow. The CLI only holds a short-lived session token locally (`~/.stelagent/session.json`). Secret keys are fetched from the server over HTTPS when needed and never written to disk.

### Network defaults

Every command defaults to **testnet**. Use `-n pubnet` on any command to switch:

```bash
npx stelagent@latest wallet balance -n pubnet
```

Or set `STELAGENT_NETWORK=pubnet` in your environment.

### Structured output

All commands return consistent JSON:

```json
{ "ok": true, "data": { ... } }
```

```json
{ "ok": false, "error": " insufficient_balance" }
```

Use `--format text` if you want human-readable output instead.

### Audit log

Every command call is logged to `~/.stelagent/audit.jsonl` with timestamp, command, duration, and redacted args. Disable with `STELAGENT_NO_AUDIT=1`.

## Common errors and what they mean

| Error                  | Cause                                      | Fix                                                    |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `AUTH_REQUIRED`        | No session — run `wallet login` first      | `npx stelagent@latest wallet login -e you@example.com` |
| `INSUFFICIENT_BALANCE` | Not enough XLM for the payment + fees      | Fund the account with test XLM from the Stellar faucet |
| `ACCOUNT_NOT_FOUND`    | Destination account doesn't exist on-chain | Verify the address; unfunded accounts can't receive    |
| `TX_TOO_OLD`           | Transaction lifetime expired               | Retry; this is usually a clock sync issue              |
| `HORIZON_ERROR 400`    | Horizon rejected the request               | Check the full error message for specifics             |

## Roadmap

### DeFi & Smart Contracts

- **Liquidity pool operations** — deposit, withdraw, and swap via Horizon's liquidity pool endpoints
- **Soroban contract interaction** — deploy, simulate, and invoke WASM smart contracts
- **Path payment routing** — find and execute multi-hop FX paths between assets
- **Claimable balance management** — create and claim balances with custom schedules

### Security & Peace of Mind

- **Transaction simulation** — preview what a transaction will do before signing and broadcasting
- **Pre-flight checks** — fee estimation with warning thresholds, balance validation, account status
- **Confirmation prompts** — explicit confirmation for high-value transfers

### Developer Experience

- **Integration tests** — runnable test suite against Horizon testnet
- **Transaction history export** — export account history as CSV or JSON for bookkeeping
- **Webhook notifications** — push alerts to a URL when an account receives a payment

## Contributing

```bash
# Set up the dev environment
vp install
vp run ready

# Run the dev server
vp run dev

# Type-check, lint, and test
vp check
vp test
```
