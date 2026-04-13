# @stecli/cli

Modular, agent-first CLI for Stellar — wallet, payments, markets, and DeFi.

## Quick Start

```bash
npx @stecli/cli wallet login -e you@example.com
```

Prompts for an OTP sent to your email, then creates or recovers your Stellar wallet.

## Usage

```bash
stecli <command> [options]
```

### `wallet login`

Sign in with email to create or recover your wallet.

```bash
stecli wallet login -e you@example.com
stecli wallet login -e you@example.com -n testnet
```

| Flag            | Description                                |
| --------------- | ------------------------------------------ |
| `-e, --email`   | Your email address (required)              |
| `-n, --network` | `testnet` or `pubnet` (default: `testnet`) |

One email always maps to one wallet. Logging in from any device with the same email recovers the same wallet.

### `wallet address`

Show the wallet public key.

```bash
stecli wallet address
```

### `wallet balance`

Show token balances.

```bash
stecli wallet balance
```

### `wallet transfer`

Send XLM to another Stellar address.

```bash
stecli wallet transfer -t GDXXX... -a 10
```

| Flag           | Description                       |
| -------------- | --------------------------------- |
| `-t, --to`     | Destination public key (required) |
| `-a, --amount` | Amount in XLM (required)          |

### `wallet logout`

Clear the local session.

```bash
stecli wallet logout
```

### `pay <url>`

Make an x402 payment to access a paywalled resource.

```bash
stecli pay https://api.example.com/premium
```

If the URL returns HTTP 402, the CLI negotiates payment using the x402 protocol and retries with a signed payment header.

## Output

All commands output structured JSON:

```json
{ "ok": true, "data": { ... } }
```

```json
{ "ok": false, "error": "..." }
```

## Architecture

Wallets are stored server-side — one wallet per email, recoverable from any device. The CLI only holds a session token locally (`~/.stecli/session.json`). Secret keys are fetched from the server over HTTPS on each command invocation and never persisted to disk.

## Development

```bash
bun install
vp run @stecli/cli#build
bun packages/cli/src/index.ts --help
```
