# @centsh/agent

Agentic wallet CLI for Stellar with x402 payments.

## Quick Start

```bash
npx @centsh/agent wallet login -e you@example.com
```

Prompts for an OTP sent to your email, then creates or recovers your Stellar wallet.

## Usage

```bash
npx @centsh/agent <command> [options]
# or
bunx @centsh/agent <command> [options]
```

### `wallet login`

Sign in with email to create or recover your wallet.

```bash
npx @centsh/agent wallet login -e you@example.com
npx @centsh/agent wallet login -e you@example.com -n testnet
```

| Flag            | Description                                |
| --------------- | ------------------------------------------ |
| `-e, --email`   | Your email address (required)              |
| `-n, --network` | `testnet` or `pubnet` (default: `testnet`) |

One email always maps to one wallet. Logging in from any device with the same email recovers the same wallet.

### `wallet address`

Show the wallet public key.

```bash
npx @centsh/agent wallet address
```

### `wallet balance`

Show token balances.

```bash
npx @centsh/agent wallet balance
```

### `wallet transfer`

Send XLM to another Stellar address.

```bash
npx @centsh/agent wallet transfer -t GDXXX... -a 10
```

| Flag           | Description                       |
| -------------- | --------------------------------- |
| `-t, --to`     | Destination public key (required) |
| `-a, --amount` | Amount in XLM (required)          |

### `wallet logout`

Clear the local session.

```bash
npx @centsh/agent wallet logout
```

### `pay <url>`

Make an x402 payment to access a paywalled resource.

```bash
npx @centsh/agent pay https://api.example.com/premium
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

Wallets are stored server-side — one wallet per email, recoverable from any device. The CLI only holds a session token locally (`~/.cent/session.json`). Secret keys are fetched from the server over HTTPS on each command invocation and never persisted to disk.

## Development

```bash
bun install
vp run @centsh/agent#build
bun tools/agent/src/index.ts --help
```
