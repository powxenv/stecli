# CLI Command Reference

Detailed parameter tables, output schemas, and usage examples for every stelagent command.

## wallet login

Request an OTP code be sent to an email address.

```bash
stelagent wallet login -e <email> [-n testnet|pubnet] [-f json|text]
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

This command only requests the OTP. Use `stelagent wallet verify` to complete authentication.

## wallet verify

Verify an OTP code and create or recover a wallet.

```bash
stelagent wallet verify -e <email> -o <otp> [-n testnet|pubnet] [-f json|text]
```

| Arg     | Flag | Required | Default   | Description                                 |
| ------- | ---- | -------- | --------- | ------------------------------------------- |
| email   | `-e` | yes      | —         | Must match the email used in `wallet login` |
| otp     | `-o` | yes      | —         | 6-digit code from email                     |
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
stelagent wallet address [-f json|text]
```

**Output:**

```json
{ "ok": true, "data": { "publicKey": "G...", "network": "testnet", "email": "..." } }
```

## wallet balance

Show all asset balances for the logged-in wallet.

```bash
stelagent wallet balance [-f json|text]
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
stelagent wallet transfer -t <destination> -a <amount> [-f json|text]
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
stelagent wallet logout [-f json|text]
```

**Output:**

```json
{ "ok": true, "data": { "loggedOut": true, "email": "user@example.com" } }
```

## pay

Make an X402 payment to a URL. Requires wallet session.

```bash
stelagent pay <url> [-f json|text]
```

| Arg | Type       | Required | Description               |
| --- | ---------- | -------- | ------------------------- |
| url | positional | yes      | URL that requires payment |

**Output (payment required):**

```json
{ "ok": true, "data": { "url": "...", "status": 200, "paymentRequired": true, "settlement": {...}, "bodyPreview": "..." } }
```

**Output (no payment needed):**

```json
{ "ok": true, "data": { "url": "...", "status": 200, "paymentRequired": false } }
```

## send

Send any asset payment.

```bash
stelagent send <destination> <amount> [-a asset] [-m memo] [-n testnet|pubnet] [-f json|text]
```

| Arg         | Flag       | Required | Default   | Description               |
| ----------- | ---------- | -------- | --------- | ------------------------- |
| destination | positional | yes      | —         | G-address                 |
| amount      | positional | yes      | —         | Amount (up to 7 decimals) |
| asset       | `-a`       | no       | `native`  | `native` or `CODE:ISSUER` |
| memo        | `-m`       | no       | —         | Memo text (max 28 chars)  |
| network     | `-n`       | no       | `testnet` | Stellar network           |
| format      | `-f`       | no       | `json`    | Output format             |

## account

Query Stellar account data. No auth required.

```bash
stelagent account details <address> [-n testnet|pubnet] [-f json|text]
stelagent account transactions <address> [-n ...] [--limit 10] [--cursor ...] [--order desc] [-f ...]
stelagent account payments <address> [same flags]
stelagent account effects <address> [same flags]
```

## assets

```bash
stelagent assets search [-c code] [-i issuer] [-n testnet|pubnet] [--limit 10] [-f json|text]
stelagent assets orderbook -s <asset> -b <asset> [-n testnet|pubnet] [--limit 10] [-f json|text]
```

Asset format: `native` for XLM, or `CODE:ISSUER` for custom assets.

## fee

```bash
stelagent fee [-n testnet|pubnet] [-f json|text]
```

## monitor

Stream real-time events. Ctrl+C to stop.

```bash
stelagent monitor transactions <address> [-n testnet|pubnet] [--cursor now] [-f json|text]
stelagent monitor payments <address> [same flags]
stelagent monitor effects <address> [same flags]
```
