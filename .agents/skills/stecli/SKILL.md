---
name: stelagent
description: "Use this skill when the user wants to set up a Stellar wallet, log in, verify OTP, check wallet balance, send XLM or assets, make X402 payments, view wallet address, query account data, search assets, check fees, stream live events, or any other interaction with the stelagent CLI for Stellar. Triggers on mentions of stelagent, Stellar wallet, X402 payments on Stellar, Stellar account queries, XLM transfers, or Stellar testnet/pubnet operations."
---

# Stelagent — Agent-First CLI for Stellar

Manage Stellar wallets, send payments, make X402 HTTP payments, and query on-chain data — all from the terminal or via AI agent orchestration.

## Instruction Priority

1. **`<NEVER>`** — Absolute prohibition. Never bypass.
2. **`<MUST>`** — Mandatory. Skipping breaks functionality.
3. **`<SHOULD>`** — Best practice. Deviation acceptable with reason.

## Pre-flight

Before the first `stelagent` command this session, verify the CLI is available:

```bash
stelagent --version
```

If not installed, inform the user: "stelagent is not installed. Please install it first."

## Command Index

| #   | Command                                               | Description                       | Auth |
| --- | ----------------------------------------------------- | --------------------------------- | ---- |
| A1  | `stelagent wallet login -e <email>`                   | Request OTP, send to email        | No   |
| A2  | `stelagent wallet verify -e <email> -o <code>`        | Verify OTP, create/recover wallet | No   |
| A3  | `stelagent wallet address`                            | Show public key (no secret)       | Yes  |
| A4  | `stelagent wallet balance`                            | Show balances                     | Yes  |
| A5  | `stelagent wallet transfer -t <addr> -a <amount>`     | Send XLM                          | Yes  |
| A6  | `stelagent wallet logout`                             | Clear local session               | Yes  |
| B1  | `stelagent pay <url>`                                 | X402 payment                      | Yes  |
| C1  | `stelagent send <addr> <amount> [-a asset] [-m memo]` | Send any asset                    | Yes  |
| D1  | `stelagent account details <addr>`                    | Account info                      | No   |
| D2  | `stelagent account transactions <addr>`               | Transaction history               | No   |
| D3  | `stelagent account payments <addr>`                   | Payment history                   | No   |
| D4  | `stelagent account effects <addr>`                    | Effect history                    | No   |
| E1  | `stelagent assets search [-c code] [-i issuer]`       | Search assets                     | No   |
| E2  | `stelagent assets orderbook -s <asset> -b <asset>`    | View orderbook                    | No   |
| F1  | `stelagent fee`                                       | Fee statistics                    | No   |
| G1  | `stelagent monitor transactions <addr>`               | Stream transactions               | No   |
| G2  | `stelagent monitor payments <addr>`                   | Stream payments                   | No   |
| G3  | `stelagent monitor effects <addr>`                    | Stream effects                    | No   |

All commands accept `-f json` (default) or `-f text`. Most accept `-n testnet|pubnet`.

## Authentication

### Step 1: Request OTP

When the user needs wallet access, ask for their email first.

**Agent message to user:**

> You need to log in with your email to use stelagent. What is your email address?

Once the user provides their email, run:

```bash
stelagent wallet login -e <email>
```

**Success response:**

```json
{ "ok": true, "data": { "message": "OTP sent to user@example.com" } }
```

**Error responses:**

```json
{ "ok": false, "error": "Could not reach auth server." }
{ "ok": false, "error": "Failed to send email" }
```

### Step 2: Ask for OTP

After `wallet login` succeeds, tell the user:

> A verification code has been sent to **{email}**. Please check your inbox and tell me the code.

<NEVER>
Do NOT guess or fabricate OTP codes. Wait for the user to provide the code.
</NEVER>

### Step 3: Verify OTP and Get Wallet

Once the user provides the OTP code, run:

```bash
stelagent wallet verify -e <email> -o <code>
```

**Success response:**

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

**Error responses:**

```json
{ "ok": false, "error": "OTP verification failed. Please try again." }
{ "ok": false, "error": "No session found. Please try again." }
{ "ok": false, "error": "Failed to create wallet. Please try again." }
```

### Step 4: Confirm Wallet

After successful verification, show the user their wallet details. Present the public key prominently:

> ✅ Wallet ready! Your Stellar address is `GABCD...WXYZ` on testnet.

<NEVER>
Do NOT display the `secretKey` unless the user explicitly asks for it. The `wallet address` command exists to retrieve just the public key without exposing the secret.
</NEVER>

### Check Login Status

To verify the user is logged in:

```bash
stelagent wallet address
```

If logged in, returns `{ "ok": true, "data": { "publicKey": "G...", "network": "testnet", "email": "..." } }`.
If not, returns `{ "ok": false, "error": "No wallet found. Run stelagent wallet login first." }`.

### Logout

```bash
stelagent wallet logout
```

## Wallet Operations

### Check Balance

```bash
stelagent wallet balance
```

Returns all asset balances for the logged-in wallet.

### Show Address (No Secret Key)

```bash
stelagent wallet address
```

Returns only `{ publicKey, network, email }`. Use this instead of `wallet balance` when only the address is needed.

<SHOULD>
Prefer `stelagent wallet address` over other commands when only the public key is needed. It does not expose the secret key over the wire.
</SHOULD>

### Send XLM

```bash
stelagent wallet transfer -t GDXYZ... -a 10.5
```

### Send Any Asset

```bash
stelagent send GDXYZ... 100 -a USDC:GAXYZ... -m "Payment for invoice"
```

For native XLM, use `-a native` or omit the flag (native is default).
Amount validation: numeric with up to 7 decimal places.
Public key validation: must match `G[A-Z2-7]{55}`.

### X402 Payments

X402 enables per-request HTTP payments using Soroban auth-entry signing:

```bash
stelagent pay https://api.example.com/premium/data
```

The flow:

1. CLI fetches the URL. If status ≠ 402, returns response directly.
2. If status = 402, signs auth entries with the wallet's Ed25519 keypair.
3. Re-fetches with payment headers. Returns the paid content.

Stelagent wallets are standard Stellar G-accounts (Ed25519) and are fully X402-compatible for both transaction signing and auth-entry signing.

## Query Commands

These do not require authentication — only a public key:

```bash
stelagent account details GDXYZ...
stelagent account transactions GDXYZ... -n pubnet --limit 20
stelagent account payments GDXYZ...
stelagent account effects GDXYZ...
stelagent assets search -c USDC
stelagent assets orderbook -s native -b "USDC:GAXYZ..."
stelagent fee
stelagent monitor transactions GDXYZ...
stelagent monitor payments GDXYZ...
stelagent monitor effects GDXYZ...
```

All accept `--format text` for human-readable tables, `--limit`, `--cursor`, `--order asc|desc`.

## Error Handling

All output follows `{ ok: true, data } | { ok: false, error: string }`.

| Error                                                  | Cause                            | Resolution                                    |
| ------------------------------------------------------ | -------------------------------- | --------------------------------------------- |
| `"No wallet found. Run stelagent wallet login first."` | Not logged in or expired session | Run `stelagent wallet login -e <email>`       |
| `"Could not reach auth server."`                       | API unreachable                  | Check network, verify `STELAGENT_API_URL`     |
| `"OTP verification failed."`                           | Wrong or expired code            | Run `stelagent wallet login -e <email>` again |
| `"Too many attempts"`                                  | 5+ wrong OTP guesses             | Request a new OTP                             |
| `"StellarAccountError"`                                | Account not found on network     | Fund testnet account via login (auto-funded)  |
| `"InsufficientBalanceError"`                           | Not enough balance               | Fund the account or reduce amount             |

## Environment Variables

| Variable                        | Default                               | Purpose                      |
| ------------------------------- | ------------------------------------- | ---------------------------- |
| `STELAGENT_API_URL`             | `https://stelagent.noval.me`          | API base URL for auth/wallet |
| `STELAGENT_HORIZON_TESTNET_URL` | `https://horizon-testnet.stellar.org` | Horizon testnet              |
| `STELAGENT_HORIZON_PUBNET_URL`  | `https://horizon-mainnet.stellar.org` | Horizon mainnet              |
