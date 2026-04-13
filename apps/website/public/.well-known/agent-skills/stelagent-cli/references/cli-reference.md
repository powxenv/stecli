# Stelagent CLI Reference

Complete parameter tables, return field schemas, and usage examples for all commands.

## wallet login

Request an OTP code be sent to an email address. This is step 1 of the two-step authentication flow. Use `wallet verify` to complete login.

```bash
npx stelagent@latest wallet login -e <email> [-n testnet|pubnet] [-f json|text]
```

| Arg     | Flag | Required | Default   | Description          |
| ------- | ---- | -------- | --------- | -------------------- |
| email   | `-e` | yes      | —         | User's email address |
| network | `-n` | no       | `testnet` | Stellar network      |
| format  | `-f` | no       | `json`    | Output format        |

**Output:**

```json
{ "ok": true, "data": { "message": "OTP sent to user@example.com" } }
```

After calling this, the user must check their email for the OTP code, then run `wallet verify` to complete authentication.

## wallet verify

Verify an OTP code and create or recover a wallet.

```bash
npx stelagent@latest wallet verify -e <email> -o <otp> [-n testnet|pubnet] [-f json|text]
```

| Arg     | Flag | Required | Default   | Description                                 |
| ------- | ---- | -------- | --------- | ------------------------------------------- |
| email   | `-e` | yes      | —         | Must match the email used in `wallet login` |
| otp     | `-o` | yes      | —         | 4–8 digit code from email                   |
| network | `-n` | no       | `testnet` | Stellar network                             |
| format  | `-f` | no       | `json`    | Output format                               |

**Output on success:**

```json
{
  "ok": true,
  "data": {
    "wallet": {
      "email": "user@example.com",
      "publicKey": "GABCD...WXYZ",
      "network": "testnet",
      "secretKey": "S...",
      "createdAt": "2026-04-13T..."
    }
  }
}
```

On testnet, the account is automatically funded via Friendbot.

**Error cases:**

- `"OTP verification failed"` — wrong code
- `"Too many attempts"` — 5+ failed guesses; request a new OTP
- `"No session found"` — internal error; retry
- `"Failed to create wallet"` — API error; retry

## wallet address

Show public key, network, and email. Does NOT expose the secret key.

```bash
npx stelagent@latest wallet address [-f json|text]
```

**Output:**

```json
{ "ok": true, "data": { "publicKey": "G...", "network": "testnet", "email": "..." } }
```

## wallet balance

Show all asset balances for the logged-in wallet.

```bash
npx stelagent@latest wallet balance [-f json|text]
```

**Output:**

```json
{
  "ok": true,
  "data": {
    "address": "G...",
    "email": "user@example.com",
    "balances": [{ "assetType": "native", "assetCode": "XLM", "balance": "10000.0000000" }]
  }
}
```

## wallet transfer

Send XLM to another Stellar address.

```bash
npx stelagent@latest wallet transfer -t <destination> -a <amount> [-f json|text]
```

| Arg    | Flag | Required | Default | Description                      |
| ------ | ---- | -------- | ------- | -------------------------------- |
| to     | `-t` | yes      | —       | Destination G-address            |
| amount | `-a` | yes      | —       | Amount in XLM (up to 7 decimals) |
| format | `-f` | no       | `json`  | Output format                    |

**Output:**

```json
{
  "ok": true,
  "data": { "from": "G...", "to": "G...", "amount": "10.5", "asset": "XLM", "txHash": "..." }
}
```

## wallet logout

Clear the local session.

```bash
npx stelagent@latest wallet logout [-f json|text]
```

**Output:**

```json
{ "ok": true, "data": { "loggedOut": true, "email": "user@example.com" } }
```

## pay

Make an X402 payment to a URL. Requires wallet session.

```bash
npx stelagent@latest pay <url> [-f json|text]
```

| Arg | Type       | Required | Description               |
| --- | ---------- | -------- | ------------------------- |
| url | positional | yes      | URL that requires payment |

**Output (payment required):**

```json
{
  "ok": true,
  "data": {
    "url": "...",
    "status": 200,
    "paymentRequired": true,
    "settlement": {},
    "bodyPreview": "..."
  }
}
```

**Output (no payment needed):**

```json
{ "ok": true, "data": { "url": "...", "status": 200, "paymentRequired": false } }
```

## preflight

Validate a payment before sending. Checks sender balance, fee estimates, and destination status. Requires wallet session.

```bash
npx stelagent@latest preflight <destination> <amount> [-a asset] [-n testnet|pubnet] [-f json|text]
```

| Arg         | Flag     | Required | Default   | Description                       |
| ----------- | -------- | -------- | --------- | --------------------------------- |
| destination | position | yes      | —         | Destination G-address             |
| amount      | position | yes      | —         | Amount to validate (up to 7 dp)   |
| asset       | `-a`     | no       | `native`  | `native` for XLM or `CODE:ISSUER` |
| network     | `-n`     | no       | `testnet` | Stellar network                   |
| format      | `-f`     | no       | `json`    | Output format                     |

**Output:**

```json
{
  "ok": true,
  "data": {
    "canProceed": true,
    "sender": "GABCD...WXYZ",
    "destination": "GEFGH...1234",
    "amount": "10",
    "asset": "XLM",
    "network": "testnet",
    "senderFunded": true,
    "destinationFunded": true,
    "destinationFundingRequired": false,
    "balances": [
      { "asset": "XLM", "available": "9999.0000000", "needed": "10.0000100", "sufficient": true }
    ],
    "estimatedFee": "100",
    "baseReserve": "1",
    "warnings": []
  }
}
```

When `canProceed` is `false`, the `warnings` array explains what would prevent the transaction.

## send

Send any asset payment.

```bash
npx stelagent@latest send <destination> <amount> [-a asset] [-m memo] [-n testnet|pubnet] [-f json|text]
```

| Arg         | Flag       | Required | Default   | Description               |
| ----------- | ---------- | -------- | --------- | ------------------------- |
| destination | positional | yes      | —         | G-address                 |
| amount      | positional | yes      | —         | Amount (up to 7 decimals) |
| asset       | `-a`       | no       | `native`  | `native` or `CODE:ISSUER` |
| memo        | `-m`       | no       | —         | Memo text (max 28 chars)  |
| network     | `-n`       | no       | `testnet` | Stellar network           |
| format      | `-f`       | no       | `json`    | Output format             |

**Output:**

```json
{
  "ok": true,
  "data": {
    "from": "G...",
    "to": "G...",
    "amount": "100",
    "asset": "USDC:G...",
    "memo": "Payment",
    "txHash": "...",
    "ledger": 12345
  }
}
```

## account

Query Stellar account data. No auth required.

```bash
npx stelagent@latest account details <address> [-n testnet|pubnet] [-f json|text]
npx stelagent@latest account transactions <address> [-n ...] [--limit 10] [--cursor ...] [--order desc] [-f ...]
npx stelagent@latest account payments <address> [same flags]
npx stelagent@latest account effects <address> [same flags]
```

**account details output:**

```json
{
  "ok": true,
  "data": {
    "id": "G...",
    "accountId": "G...",
    "sequence": "123456789",
    "subentryCount": 1,
    "thresholds": { "low": 0, "med": 0, "high": 0 },
    "balances": [...],
    "signers": [...],
    "flags": { "authRequired": false, "authRevocable": false, "authImmutable": false, "authClawbackEnabled": false },
    "lastModifiedLedger": 12345,
    "lastModifiedTime": "2026-..."
  }
}
```

## assets

```bash
npx stelagent@latest assets search [-c code] [-i issuer] [-n testnet|pubnet] [--limit 10] [-f json|text]
npx stelagent@latest assets orderbook -s <asset> -b <asset> [-n testnet|pubnet] [--limit 10] [-f json|text]
```

Asset format: `native` for XLM, or `CODE:ISSUER` for custom assets.

## fee

```bash
npx stelagent@latest fee [-n testnet|pubnet] [-f json|text]
```

**Output:**

```json
{
  "ok": true,
  "data": {
    "feeCharged": { "min": "100", "max": "100", "mode": "100", "p10": "100", ... },
    "maxFee": { "min": "100", "max": "100", "mode": "100", ... },
    "ledgerCapacity": "0.05"
  }
}
```

## monitor

Stream real-time events. Ctrl+C to stop.

```bash
npx stelagent@latest monitor transactions <address> [-n testnet|pubnet] [--cursor now] [-f json|text]
npx stelagent@latest monitor payments <address> [same flags]
npx stelagent@latest monitor effects <address> [same flags]
```

## mcp

Start the MCP server on stdio for integration with AI clients.

```bash
npx stelagent@latest mcp
```

No flags. Communicates via JSON-RPC 2.0 over stdin/stdout. Logs to stderr.

Exposes 15 tools across wallet, account, asset, and payment categories. Includes wallet_login and wallet_verify for full 1:1 CLI parity. See SKILL.md for the full tool surface.
