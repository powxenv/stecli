# Stelagent Troubleshooting

> Load this file when a stelagent operation fails or an edge case is encountered.

## Send / Transfer

- **Preflight check**: Use `npx stelagent@latest preflight <addr> <amount>` to validate a payment before sending. Returns `canProceed`, balance details, fee estimate, and warnings about unfunded destinations.
- **Insufficient balance**: Check balance first with `npx stelagent@latest wallet balance`. Warn if remaining would fall below minimum reserve (1 XLM base + 0.5 XLM per trustline/offer/signer).
- **Unfunded destination**: If the destination account doesn't exist on the network, the send transaction will fail with `StellarAccountError`. The destination must first receive at least 1 XLM from a funded account.
- **Invalid asset format**: Custom assets must be `CODE:ISSUER` (e.g., `USDC:GBXK...`). If format is wrong, CLI returns a Zod validation error.
- **Amount too precise**: Stellar supports up to 7 decimal places. More precision is truncated or rejected.

## Account Queries

- **Unfunded account (Horizon 404)**: Accounts that have never received XLM return 404. The CLI translates this to `UnfundedAccountError`. Solution: fund the account with at least 1 XLM.
- **No transactions/payments/effects**: Returns empty arrays. Display "No results found" — not an error.
- **Rate limited (429)**: Horizon limits 3,600 requests/hour/IP. Wait and retry. Self-hosted Horizon can configure higher limits.
- **Network timeout**: If Horizon is unreachable, the CLI returns `NetworkTimeoutError`. Check connection and `STELAGENT_HORIZON_*_URL` env vars.

## X402 Payment

- **Non-402 response**: The resource doesn't require payment. Return response directly — no payment was needed.
- **Payment failed (non-200 after signing)**: The server rejected the payment. Check `settlement` header for details. May indicate insufficient balance or expired auth window.
- **Wallet not logged in**: X402 requires a wallet session. Run `npx stelagent@latest wallet login` first.

## Monitor (SSE)

- **Connection drops**: Horizon SSE streams may disconnect. The CLI handles reconnection internally.
- **Cursor usage**: Use `--cursor <id>` to resume from a specific event. Default `now` starts from new events only.
- **Rate limit during streaming**: Each SSE event counts against Horizon rate limits. Long-running streams on high-activity accounts may hit limits.

## Authentication

- **OTP expired**: OTP codes expire after a few minutes. Request a new one with `npx stelagent@latest wallet login -e <email>`.
- **Too many attempts**: 5+ wrong OTP guesses locks the session. Request a new OTP.
- **API unreachable**: Check network connection and `STELAGENT_API_URL` env var. Default: `https://stelagent.noval.me`.
- **Session corrupted**: Delete `~/.stelagent/session.json` and re-login.

## MCP Server

- **Server won't start**: Ensure `@modelcontextprotocol/sdk` is installed. Run `npx stelagent@latest mcp` and check stderr for errors.
- **Tools return auth errors**: Wallet tools require an active session. Use `wallet_login` then `wallet_verify` to authenticate.
- **Client can't connect**: Ensure the MCP config points to the correct command (`npx stelagent@latest mcp` or `bunx stelagent@latest mcp`).

## Common (All Commands)

- **`InvalidNetworkError`**: Only `testnet` and `pubnet` are valid. Check the `-n` flag.
- **`HorizonError`**: Generic Horizon failure. Check the `cause` field for details.
- **Malformed public key**: Must match `G[A-Z2-7]{55}`. Common mistakes: lowercase letters, wrong prefix, incomplete key.
