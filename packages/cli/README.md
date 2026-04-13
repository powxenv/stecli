# Stelagent CLI

Modular, agent-first CLI for Stellar — wallet, payments, markets, and monitoring.

## Quick start for AI agents

Paste this prompt into any AI agent (Claude Code, Cursor, OpenCode, OpenClaw, Hermes Agent, etc.) and chat naturally:

```
Read https://stelagent.noval.me/AGENTS.md, then set it up for me.
```

The agent reads the skill definition, handles wallet creation, OTP verification, and every Stellar operation on your behalf.

### Install the skill permanently

```bash
# Via flins (recommended)
npx flins@latest add stelagent.noval.me

# Via skills.sh
npx skills add stelagent.noval.me/stelagent-cli
```

Both commands download the skill into your project's `.agents/skills/` directory and wire it into your agent's configuration automatically.

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
stelagent wallet login -e you@example.com                    # Request OTP
stelagent wallet verify -e you@example.com -o 123456          # Verify OTP
stelagent wallet address                                     # Show public key
stelagent wallet balance                                    # Check balances
stelagent wallet transfer -t GDXXX... -a 10                  # Send XLM
stelagent wallet logout                                     # Clear session
```

### Payments

```bash
stelagent send GDXXX... 100 -a USDC:GAXYZ...                # Custom asset
stelagent send GDXXX... 50 -a native --memo text:ref-99     # XLM with memo
stelagent pay https://api.example.com/premium                # x402 payment
```

### Account queries

```bash
stelagent account details GDXXX...          # Balances, signers, thresholds
stelagent account transactions GDXXX...      # Transaction history
stelagent account payments GDXXX...          # Payment history
stelagent account effects GDXXX...           # Effect history
```

### Assets & fees

```bash
stelagent assets search --code USDC                              # Search assets
stelagent assets orderbook --selling XLM --buying USDC:G...     # Order book
stelagent fee                                                    # Fee stats
```

### Streaming

```bash
stelagent monitor transactions GDXXX...     # Stream transactions
stelagent monitor payments GDXXX...         # Stream payments
stelagent monitor effects GDXXX...          # Stream effects
```

### MCP server

```bash
stelagent mcp    # Start MCP server on stdio
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
