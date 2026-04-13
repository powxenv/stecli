# Stelagent CLI

Modular, agent-first CLI for Stellar — wallet, payments, markets, and monitoring.

## Quick start for AI agents

Paste this prompt into any AI agent (Claude Code, Cursor, OpenCode, OpenClaw, Hermes Agent, etc.) and chat naturally:

```
Read https://stelagent.noval.me/AGENTS.md, then set it up for me.
```

The agent reads the skill definition, handles wallet creation, OTP verification, and every Stellar operation on your behalf.

### Install the skill

```bash
# Via flins (recommended)
npx flins@latest add stelagent.noval.me

# Via skills.sh
npx skills add stelagent.noval.me/stelagent-cli
```

Both commands download the skill into your project's skills directory and wire it into your agent's configuration automatically.

## Install

```bash
npx stelagent@latest <command>
# or
bunx stelagent@latest <command>
```

No install needed — `npx` always runs the latest published version.

## Commands

### Wallet

```bash
npx stelagent@latest wallet login -e you@example.com                    # Request OTP
npx stelagent@latest wallet verify -e you@example.com -o 123456          # Verify OTP
npx stelagent@latest wallet address                                     # Show public key
npx stelagent@latest wallet balance                                    # Check balances
npx stelagent@latest wallet transfer -t GDXXX... -a 10                  # Send XLM
npx stelagent@latest wallet logout                                     # Clear session
```

### Payments

```bash
npx stelagent@latest send GDXXX... 100 -a USDC:GAXYZ...                # Custom asset
npx stelagent@latest send GDXXX... 50 -a native --memo text:ref-99     # XLM with memo
npx stelagent@latest pay https://api.example.com/premium                # x402 payment
```

### Account queries

```bash
npx stelagent@latest account details GDXXX...          # Balances, signers, thresholds
npx stelagent@latest account transactions GDXXX...      # Transaction history
npx stelagent@latest account payments GDXXX...          # Payment history
npx stelagent@latest account effects GDXXX...           # Effect history
```

### Assets & fees

```bash
npx stelagent@latest assets search --code USDC                              # Search assets
npx stelagent@latest assets orderbook --selling XLM --buying USDC:G...     # Order book
npx stelagent@latest fee                                                    # Fee stats
```

### Streaming

```bash
npx stelagent@latest monitor transactions GDXXX...     # Stream transactions
npx stelagent@latest monitor payments GDXXX...         # Stream payments
npx stelagent@latest monitor effects GDXXX...          # Stream effects
```

### MCP server

```bash
npx stelagent@latest mcp    # Start MCP server on stdio
```

All commands accept `-n testnet|pubnet` (default: `testnet`) and `-f json|text`. Account and asset queries support `--limit`, `--cursor`, and `--order asc|desc`.

## Authentication

Two-step OTP flow:

1. **`wallet login -e <email>`** — sends a one-time code to your email
2. **`wallet verify -e <email> -o <code>`** — verifies the code and creates (or recovers) your wallet

One email maps to one wallet, recoverable from any device.

## Output

All commands return structured JSON:

```json
{ "ok": true, "data": { ... } }
```

```json
{ "ok": false, "error": "..." }
```

Use `--format text` for human-readable output.

## Architecture

Wallets are stored server-side — one wallet per email, recoverable from any device. The CLI only holds a session token locally (`~/.stelagent/session.json`). Secret keys are fetched over HTTPS when needed and never written to disk.

## Development

```bash
bun install
vp run @stelagent/cli#build
bun packages/cli/src/index.ts --help
```
