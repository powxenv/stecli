# cent — Project Specification

## Executive Summary

**cent** is a content and API monetization platform built on Stellar using x402 and MPP protocols. "Toll" refers to payment for passage — content and APIs behind a paywall. "402" references HTTP 402 Payment Required status code and the x402 protocol.

The platform offers two products:

1. **cent Hosted** — Upload and monetize files (PDFs, images, videos, audio, articles)
2. **cent SDK** — Express.js middleware for protecting API endpoints

**Protocol Support:**

- **x402** — HTTP-native payments via facilitator (Coinbase/OpenZeppelin)
- **MPP Charge** — Direct Soroban SAC transfers, no facilitator required

**Target Users:**

- **Creators** — Upload content, set price, share link, earn USDC
- **Developers** — Protect API endpoints with middleware, monetize per-request

---

## Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Payment Protocols Supported                                            │
├─────────────────────────────────────────────────────────────────────────┤
││││x402 Protocol                                         │
│  ││││Definition: HTTP 402 Payment Required → Client pays → Retry with signature      │
│  │ Verification: External facilitator verifies payment                    │
│  │ Settlement: ~5 seconds (facilitator submits tx)                         │
│  │ Use Case: One-time payments, sporadic traffic                          │
│  │ Best For: File downloads, infrequent API calls│
│  │ Complexity: Medium (requires facilitator infrastructure)         │
│  │ ││  │ │ │ │ │ │ ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ │ MPP Charge                                                           │ │
│  │ │                                                                     │ │
│  │ │ Definition: Soroban SAC transfer per request                        │ │
│  │ │ Verification: Direct on-chain Soroban call                          │ │
│  │ │ Settlement: ~5 seconds (Stellar finality)                          │ │
│  │ │ Use Case: One-time payments, predictable traffic                    │ │
│  │ │ Best For: API endpoints, predictable volume                        │ │
│  │ │ Complexity: Low (no external facilitator)                          │ │
│  │ │ Dependencies: @stellar/mpp SDK                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
││││When to Use Each:                                                         │
│││  │ Use x402 when:                                                         │
│  │ - Hosting on Coinbase/OpenZeppelin facilitator              │
│  │ - Want facilitator to handle transaction submission                   │
│  │- Need facilitator analytics/infrastructure                            │
│  │ ││  │ Use MPP Charge when:                                                │
│  │ - Want direct settlement (no middleman)                              │
│  │ - Have predictable request volume                                     │
│  │ - Prefer simpler on-chain verification                                │
││└─────────────────────────────────────────────────────────────────────────┘
```

---

## Problem Statement

### For Content Creators

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Creator Monetization Problems                                          │
├─────────────────────────────────────────────────────────────────────────┤
││││PDF Reports / E-books                                       │
│  ├── Gumroad: 10% fee + $0.30 per sale                        │
│  ├── Patreon: 8-12% fee                                       │
│  └── Problem: High fees, subscription required│
││││Videos / Audio                                        │
│  ├── YouTube: Ad revenue only (low per-view)                     │
│  ├── Vimeo: Subscription tiers                 │
│  └── Problem: No pay-per-view micropayments│
││││Articles / Research                                             │
│  ├── Medium: Partner program (low rates)              │
│  ├── Substack: 10% fee                        │
│  └── Problem: Requires subscription│
││││Missing: Pay-per-download with instant USDC settlement, 0% platform fee│
└─────────────────────────────────────────────────────────────────────────┘
```

### For API Developers

```
┌─────────────────────────────────────────────────────────────────────────┐
│ API Monetization Problems                                                  │
├─────────────────────────────────────────────────────────────────────────┤
││││Current Options:                                                        │
│  ├── Stripe Billing: $0.30 + 2.9% per transaction                        │
│  ├── Subscription APIs: Complex setup, monthly billing only               │
│  ├── x402 native: Requires facilitator setup, no dashboard                 │
│  └── xpay.sh: 1.5-2.5% fee                                                │
││││Missing: Simple middleware + dashboard + 0% platform fee│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Product 1: cent Hosted

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ cent Hosted — Upload and Monetize Files                        │
├─────────────────────────────────────────────────────────────────────────┤
││││For: Content creators (writers, researchers, artists)               │
││││Supported Content Types:                                                │
│  ├── PDFs (e-books, reports, whitepapers) — up to 100MB                  │
│  ├── Images (photos, illustrations) — up to 50MB                         │
│  ├── Videos (courses, tutorials) — up to 500MB                          │
│  ├── Audio (music, podcasts) — up to 200MB│
│  ├── Articles (text/markdown) — up to 1MB|│││Creator Experience:                                                        │
│  │  1. Upload file via dashboard or API      │
│  │  2. Set price in USDC                                                  │
│  │  3. Choose protocol: x402 (default) or MPP Charge│
│  │  4. Receive pay.cent.dev/abc123 link             │
│  │  5. Share link anywhere                                                │
│  │  6. Earn USDC instantly on every download                         │
│││││Protocol Selection:                                                    │
│  │  ├── x402 (default): Best for unpredictable download volume          │
│  │  └── MPP Charge: Best for predictable, high-volume downloads         │
│└─────────────────────────────────────────────────────────────────────────┘
```

### Creator Journey

```
Step 1: Upload Content
┌────────────────────────────────────────────────────────────────────────┐
│cent Dashboard                                             │
│ ┌────────────────────────────────────────────────────────────────────┐│
│ │ [Upload File]                    [Create Article]                   ││
│ │                                                                    ││
│ │ Choose file: [my-report.pdf]                              ││
│ │ Title: The Future of AI Agents                                      ││
│ │ Description: A comprehensive analysis of agentic workflows...     ││
│ │ Price: $[0].[05] USDC                                              ││
│ │ Protocol: [x402 ▼] (recommended)                                 ││
│ │          ○ x402 - Uses facilitator                    ││
│ │          ○ MPP Charge - Direct on-chain settlement                  ││
│ │                                            ││
│ │ ☐ Enable preview (first 2 pages)                                   ││
│ │ ☐ Enable programmatic access (agents)                              ││
│ │                                            ││
│ │                        [Upload]                                     ││
│ └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘

Step 2: Receive Paywall Link
┌────────────────────────────────────────────────────────────────────────┐
│ Content Uploaded Successfully                                  │
│ ┌────────────────────────────────────────────────────────────────────┐│
│ │ Title: The Future of AI Agents                                      ││
│ │ Type: PDF (2.4 MB)                                                  ││
│ │ Price: $0.05 USDC                                                   ││
│ │ Protocol: x402                                        ││
│ │                                ││
│ │ Paywall Link: pay.cent.dev/abc123                            ││
│ │                                        ││
│ │ [Copy] [Share on Twitter] [Embed Code]                            ││
│ │                                            ││
│ │ Analytics:                                            ││
│ │ Views: 0│ Downloads: 0  │ Revenue: $0.00                        │
│ └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘

Step 3: Downloader Pays and Receives File
┌────────────────────────────────────────────────────────────────────────┐
│ Download "The Future of AI Agents"                      │
│ ┌────────────────────────────────────────────────────────────────────┐│
│ │ Price: $0.05 USDC                                        ││
│ │                                                        ││
│ │ [Pay with Freighter]  [Pay with Albedo]                            ││
│ │                                            ││
│ │ □ Albedo (no extension needed)                                      ││
│ │                                            ││
│ │ Protocol: x402                                        ││
│ │ Settlement: ~5 seconds                                              ││
│ │                                            ││
│ │ What is this?                                                       ││
│ │ USDC is a stablecoin backed 1:1 by US dollars.                    ││
│ │ Network fee: ~$0.00001 (Stellar)                                    ││
│ └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Content table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_key TEXT,                          -- S3 key for file storage
  file_size BIGINT,
  file_type TEXT,                         -- MIME type
  content_body TEXT,                      -- For articles (stored in DB)
  price_stroops BIGINT NOT NULL,          -- Price in stroops
  asset_code TEXT DEFAULT 'USDC',
  network TEXT DEFAULT 'stellar:testnet',
  protocol TEXT DEFAULT 'x402',           -- 'x402' or 'mpp-charge'
  preview_enabled BOOLEAN DEFAULT TRUE,
  download_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT TRUE
);
```

---

## Product 2: cent SDK

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ cent SDK — Express.js Middleware for API Monetization        │
├─────────────────────────────────────────────────────────────────────────┤
││││For: API developers and Express.js website owners    │
││││Use Case: Protect endpoints → Monetize per-request       │
││││Simplified Integration:                                             │
│  │ ││  │ // x402 native (manual setup)                                          │
│  │ import { paymentMiddlewareFromConfig } from "@x402/express";        │
│  │ import { HTTPFacilitatorClient } from "@x402/core/server";           │
│  │ import { ExactStellarScheme } from "@x402/stellar/exact/server";    │
│  │ ││  │ app.get("/api/data", paymentMiddlewareFromConfig(                      │
│  │   { "GET /api/data": { accepts: { scheme: "exact", price: "$0.05", ... } } },│
│  │   new HTTPFacilitatorClient({ url: "..." }),                         │
│  │   [{ network: "stellar:testnet", server: new ExactStellarScheme() }]│
│  │ ), handler);                                                        │
│  │ ││  │ // cent SDK (simplified)                                             │
│  │ import { init, protect } from "@centsh/sdk";                    │
│  │ init({ apiKey: "toll_test_xxx" });                                    │
│  │ ││  │ app.get("/api/data", protect({ price: 0.05 }), handler);                │
│  │ ││  │ // With protocol selection                                                   │
│  │ app.get("/api/data", protect({ price: 0.05, protocol: "x402" }), handler);│
│  │ app.get("/api/data", protect({ price: 0.05, protocol: "mpp-charge" }), handler);│
│││││Dashboard Integration:                                                     │
│  │ ├── Automatic endpoint registration                                  │
│  │ ├── Real-time request/revenue tracking                               │
│  │ ├── Per-endpoint analytics                                          │
│  │ └── Top payers across all endpoints                                │
││└─────────────────────────────────────────────────────────────────────────┘
```

### SDK Usage

```typescript
// ========================================
// Installation and Setup
// ========================================

import express from "express";
import { init, protect } from "@centsh/sdk";

const app = express();

// Initialize with API key (toll_live_xxx or toll_test_xxx)
init({
  apiKey: process.env.CENT_API_KEY,
  defaultProtocol: "x402", // or 'mpp-charge'
});

// ========================================
// Basic Usage — Default Protocol (x402)
// ========================================

app.get(
  "/api/basic",
  protect({ price: 0.01 }), // Uses default protocol (x402)
  (req, res) => {
    res.json({ data: "basic data" });
  },
);

// ========================================
// Explicit Protocol Selection
// ========================================

// x402 — best for sporadic traffic, uses facilitator
app.get(
  "/api/premium-x402",
  protect({
    price: 0.05,
    protocol: "x402",
  }),
  (req, res) => {
    res.json({ data: "premium data via x402" });
  },
);

// MPP Charge — best for predictable traffic, direct settlement
app.get(
  "/api/premium-mpp",
  protect({
    price: 0.05,
    protocol: "mpp-charge",
  }),
  (req, res) => {
    res.json({ data: "premium data via MPP Charge" });
  },
);

// ========================================
// Dynamic Pricing
// ========================================

app.post(
  "/api/ai/completions",
  protect({
    price: (req) => {
      // Estimate tokens from prompt
      const tokens = req.body.prompt.length / 4;
      return tokens * 0.00001; // $0.00001 per token
    },
    protocol: "x402",
  }),
  (req, res) => {
    const completion = generateCompletion(req.body.prompt);
    res.json({ completion });
  },
);

// ========================================
// Access Payment Info
// ========================================

app.get("/api/protected", protect({ price: 0.05 }), (req, res) => {
  // Payment info attached to request
  const payer = req.cent.payment.payerAddress;
  const amount = req.cent.payment.amount;
  const protocol = req.cent.payment.protocol;
  const txHash = req.cent.payment.txHash;

  console.log(`Request from ${payer} paid ${amount} USDC via ${protocol}`);

  res.json({ data: "protected data", payer });
});

// ========================================
// Multiple Tiers
// ========================================

app.get("/api/basic", protect({ price: 0.01 }), handler);
app.get("/api/standard", protect({ price: 0.05 }), handler);
app.get("/api/premium", protect({ price: 0.1 }), handler);

// ========================================
// Website Routes (protect HTML)
// ========================================

app.get(
  "/premium/article/:slug",
  protect({
    price: 0.05,
    contentIdFrom: "params.slug",
  }),
  (req, res) => {
    const article = getArticle(req.params.slug);
    res.render("article", { article });
  },
);

// ========================================
// Error Handling
// ========================================

app.get(
  "/api/data",
  protect({
    price: 0.05,
    onError: (err, req, res, next) => {
      if (err.code === "PAYMENT_REQUIRED") {
        res.status(402).json({
          error: "Payment required",
          price: "0.05 USDC",
          protocol: err.protocol,
          payUrl: err.payUrl,
        });
      } else {
        next(err);
      }
    },
  }),
  handler,
);

// ========================================
// Analytics (Programmatic)
// ========================================

import { getAnalytics } from "@centsh/sdk";

const analytics = await getAnalytics({
  startDate: new Date("2024-01-01"),
  endDate: new Date(),
  groupBy: "endpoint", // or 'protocol' or 'day'
});

console.log(`Requests: ${analytics.total.requests}`);
console.log(`Revenue: ${analytics.total.revenue} USDC`);
console.log(`x402 Revenue: ${analytics.byProtocol.x402.revenue}`);
console.log(`MPP Revenue: ${analytics.byProtocol["mpp-charge"].revenue}`);
```

### Protocol Differences in Practice

```
┌─────────────────────────────────────────────────────────────────────────┐
│ x402 vs MPP Charge in Practice                                       │
├─────────────────────────────────────────────────────────────────────────┤
││││x402 Flow:                                                            │
│  │ ││  │ 1. Client requests endpoint                                       │
│  │  2. Server returns 402 with payment requirements                       │
│  │  3. Client constructs payment, signs with wallet                      │
│  │  4. Client retries with PAYMENT-SIGNATURE header                     │
│  │  5. Server verifies signature with facilitator                        │
│  │  6. Facilitator submits transaction on-chain                        │
│  │  7. Server serves content                                              │
│  │ ││││MPP Charge Flow:                                                        │
│  │ ││  │ 1. Client requests endpoint                                       │
│  │  2. Server returns 402 with payment requirements                       │
│  │  3. Client constructs Soroban SAC transfer                      │
│  │  4. Client signs and broadcasts transaction                           │
│  │  5. Client retries with transaction hash                              │
│  │  6. Server verifies transaction directly on-chain                  │
│  │  7. Server serves content                                              │
│  │ ││││Key Difference:                                                          │
│  │ ││  │ x402: Facilitator submits tx (client signs auth entry)         │
│  │ │ MPP Charge: Client submits tx directly                         │
│  │ ││││Trade-offs:                                                       │
│  │ ││  │ x402:                                                            │
│  │ │   + Facilitator handles complexity│
│  │ │   + Better for clients without Stellar account                   │
│  │ │   - Requires trusted facilitator                                   │
│  │ │   - Facilitator can be bottleneck│
│  │ │   │ MPP Charge:                                                            │
│  │ │   + No intermediary                                                  │
│  │ │   + Direct on-chain settlement                                      │
│  │ │   - Client must have XLM for fees                                   │
│  │ │   - Client must broadcast transaction                               │
││└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ cent System Architecture                                         │
├─────────────────────────────────────────────────────────────────────────┤
││││┌─────────────────────────────────────────────────────────────────┐│
│  │ Frontend (Next.js)                                                  ││
│  │ ├── Landing page                                                        │
│  │ ├── Upload dashboard (files, articles)                              │
│  │ ├── Payment UI (wallet connection, protocol display)                │
│  │ ├── Download page (x402 or MPP Charge)                                │
│  │ └── Analytics dashboard (revenue by protocol)                        │
│  └─────────────────────────────────────────────────────────────────────┘│
│┌─────────────────────────────────────────────────────────────────────┐│
│  │ Backend API (Node.js + Express)                                    ││
│  │ ├── /v1/content/* (upload, download, manage)                        │
│  │ ├── /v1/tokens/* (payment validation)                                  │
│  │ ├── /v1/analytics/* (revenue, requests, by-protocol)                  │
│  │ └── /v1/api-keys/* (key management)                                    │
│  └─────────────────────────────────────────────────────────────────────┘│
│┌─────────────────────────────────────────────────────────────────────┐│
│  │ Payment Layer (Protocol Abstraction)                               ││
│  │ ├── PaymentProtocol interface                                          │
│  │ │   ├── X402Protocol                                                       │
│  │ │   │   ├── @x402/express middleware                                      │
│  │ │   │   ├── HTTPFacilitatorClient                                         │
│  │ │   │   └── ExactStellarScheme                                            │
│  │ │   │                                                                       │
│  │ │   ├── MPPChargeProtocol                                               │
│  │ │   │   ├── @stellar/mpp/charge/server               │
│  │ │   │   └── Soroban SAC verification                                      │
│  │ │   │                                                                       │
│  │ │   └── selectProtocol(config) → middleware                          │
│  │ │                                                                       │
│  │ └── Unified payment validation                                         │
│  │     ├── extractSignature(req)                                           │
│  │     ├── verifyPayment(signature, protocol)                                │
│  │     └── attachPaymentInfo(req, payment)                                │
│  └─────────────────────────────────────────────────────────────────────┘│
│┌─────────────────────────────────────────────────────────────────────┐│
│  │ Data Layer││
│  │ ├── PostgreSQL (users, content, payments, analytics)              │
│  │ ├── S3-compatible storage (files)│
│  │ ├── Redis (session cache, rate limiting)│
│  │ └── Stellar ledger (immutable payment records)                       │
│  └─────────────────────────────────────────────────────────────────────┘│
│┌─────────────────────────────────────────────────────────────────────┐│
│  │ External Integrations                                               ││
│  │ ├── Coinbase Facilitator (x402 testnet)                                │
│  │ ├── OpenZeppelin Relayer (x402 mainnet)│
│  │ ├── Stellar RPC (MPP Charge settlement)│
│  │ ├── Freighter wallet (browser extension)│
│  │ └── Albedo wallet (web-based)│
│  └─────────────────────────────────────────────────────────────────────┘│
```

### Protocol Abstraction Implementation

```typescript
// lib/protocols.ts

import { RequestHandler, Request } from "express";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { chargeMiddleware } from "@stellar/mpp/charge/server";

// ========================================
// Types
// ========================================

export type Protocol = "x402" | "mpp-charge";

export interface ProtectConfig {
  price: number; // Price in USDC
  contentId?: string; // For analytics
  contentIdFrom?: string; // e.g., 'params.slug'
  network?: "stellar:testnet" | "stellar:mainnet";
  protocol?: Protocol; // Default: 'x402'
  recipient?: string; // Override recipient address
  onError?: (err: Error, req: Request, res: any, next: any) => void;
}

export interface PaymentInfo {
  payerAddress: string;
  amount: string; // e.g., "0.05"
  asset: string; // e.g., "USDC"
  protocol: Protocol;
  txHash: string;
  network: string;
  timestamp: number;
}

// ========================================
// Protocol Interface
// ========================================

interface PaymentProtocol {
  name: Protocol;
  createMiddleware(config: ProtectConfig, recipient: string): RequestHandler;
  validatePayment(req: Request): Promise<PaymentInfo | null>;
}

// ========================================
// x402 Implementation
// ========================================

class X402Protocol implements PaymentProtocol {
  name: Protocol = "x402";
  private facilitatorUrl: string;

  constructor(config: { facilitatorUrl: string }) {
    this.facilitatorUrl = config.facilitatorUrl;
  }

  createMiddleware(config: ProtectConfig, recipient: string): RequestHandler {
    const network = config.network || "stellar:testnet";
    const priceStr = `$${config.price.toFixed(2)}`;

    return paymentMiddlewareFromConfig(
      {
        [`GET ${config.contentId || "/"}`]: {
          accepts: {
            scheme: "exact",
            price: priceStr,
            network,
            payTo: recipient,
          },
        },
      },
      new HTTPFacilitatorClient({ url: this.facilitatorUrl }),
      [{ network, server: new ExactStellarScheme() }],
    );
  }

  async validatePayment(req: Request): Promise<PaymentInfo | null> {
    const signature = req.headers["payment-signature"] as string;
    if (!signature) return null;

    // Parse signature and validate with facilitator
    // Implementation depends on facilitator response
    // Returns PaymentInfo if valid, null otherwise
    return null; // Simplified
  }
}

// ========================================
// MPP Charge Implementation
// ========================================

class MPPChargeProtocol implements PaymentProtocol {
  name: Protocol = "mpp-charge";

  createMiddleware(config: ProtectConfig, recipient: string): RequestHandler {
    const network = config.network || "stellar:testnet";
    const priceStroops = BigInt(config.price * 10_000_000); // Convert to stroops

    return chargeMiddleware({
      price: priceStroops,
      asset: { code: "USDC", issuer: getAssetIssuer(network) },
      recipient,
      network,
    });
  }

  async validatePayment(req: Request): Promise<PaymentInfo | null> {
    const txHash = req.headers["x-transaction-hash"] as string;
    if (!txHash) return null;

    // Verify transaction on-chain via Soroban RPC
    // Check that correct SAC transfer occurred
    // Returns PaymentInfo if valid, null otherwise
    return null; // Simplified
  }
}

// ========================================
// Protocol Registry
// ========================================

export class ProtocolRegistry {
  private protocols: Map<Protocol, PaymentProtocol>;

  constructor(config: { facilitatorUrl: string }) {
    this.protocols = new Map([
      ["x402", new X402Protocol(config)],
      ["mpp-charge", new MPPChargeProtocol()],
    ]);
  }

  getProtocol(name: Protocol): PaymentProtocol {
    const protocol = this.protocols.get(name);
    if (!protocol) {
      throw new Error(`Unknown protocol: ${name}`);
    }
    return protocol;
  }

  createMiddleware(config: ProtectConfig, recipient: string): RequestHandler {
    const protocol = this.getProtocol(config.protocol || "x402");
    return protocol.createMiddleware(config, recipient);
  }
}

// ========================================
// Helper Functions
// ========================================

function getAssetIssuer(network: string): string {
  // USDC issuer addresses
  const issuers = {
    "stellar:testnet": "GBRFXS6JGBRHKLXSFBYEW2BVWE5VSP7BOKRQZSWXBOUQW3TVEXNQG6GJ",
    "stellar:mainnet": "GA5ZSEJQBBQCFFXDDDZNJBWXYKOOC4DME4F6M5KEWEURYDOSKRYLQLVT",
  };
  return issuers[network as keyof typeof issuers];
}
```

### Main Protect Function

```typescript
// index.ts

import { RequestHandler, Request, Response, NextFunction } from "express";
import { ProtocolRegistry, ProtectConfig, PaymentInfo } from "./lib/protocols";

// Singleton registry
let registry: ProtocolRegistry | null = null;

// Configuration from init()
interface InitConfig {
  apiKey: string;
  defaultProtocol?: "x402" | "mpp-charge";
  facilitatorUrl?: string;
  network?: "stellar:testnet" | "stellar:mainnet";
}

export function init(config: InitConfig): void {
  const facilitatorUrl =
    config.facilitatorUrl ||
    (config.network === "stellar:mainnet"
      ? "https://facilitator.stellar.org"
      : "https://facilitator.testnet.stellar.org");

  registry = new ProtocolRegistry({ facilitatorUrl });

  // Store default protocol
  (global as any).__centDefaultProtocol__ = config.defaultProtocol || "x402";
  (global as any).__centNetwork__ = config.network || "stellar:testnet";
}

export function protect(config: Omit<ProtectConfig, "network">): RequestHandler {
  if (!registry) {
    throw new Error("cent not initialized. Call init() first.");
  }

  const defaultProtocol = (global as any).__centDefaultProtocol__ || "x402";
  const network = (global as any).__centNetwork__ || "stellar:testnet";

  const fullConfig: ProtectConfig = {
    ...config,
    protocol: config.protocol || defaultProtocol,
    network,
  };

  // Get recipient address from config or API key lookup
  const recipient = getRecipientAddress();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Apply protocol middleware
    const middleware = registry!.createMiddleware(fullConfig, recipient);

    middleware(req, res, (err) => {
      if (err) {
        if (config.onError) {
          config.onError(err, req, res, next);
        } else {
          next(err);
        }
        return;
      }

      // Attach payment info to request
      (req as any).cent = {
        payment: extractPaymentInfo(req, fullConfig),
      };

      // Track analytics (fire-and-forget)
      trackAnalytics(fullConfig, (req as any).cent.payment).catch(() => {});

      next();
    });
  };
}

// Export types
export { ProtectConfig, PaymentInfo };
```

---

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│ cent API Endpoints                                                    │
├─────────────────────────────────────────────────────────────────────────┤
││││Content Endpoints (Hosted)                                              │
││││  POST/v1/content/upload                                                    │
│  │   Headers: Authorization: Bearer <api_key>                                     │
│  │   Body: multipart/form-data (file, title, price, protocol)                     │
│  │   Response: { contentId, paywallUrl, downloadUrl }                             │
│  │ ││  │ GET /v1/content/:id│
│  │   Headers: Authorization: Bearer <payment_token>                             │
│  │   Response: File download (binary)                                        │
│  │   Error: 402 Payment Required                                             │
│  │ ││  │ GET/v1/content/:id/info                                                      │
│  │   Response: { title, price, protocol, fileSize, fileType }              │
│  ││││SDK Endpoints (Analytics)                                                  │
││││  GET/v1/analytics/overview                                                     │
│  │   Headers: Authorization: Bearer <api_key>                                     │
│  │   Response: { totalRequests, totalRevenue, byProtocol: {...} }                 │
│  │ ││  │ GET /v1/analytics/by-endpoint                                              │
│  │   Response: [{ endpoint, requests, revenue, protocol }, ...]       │
│  │ │││Payment Endpoints (Internal)                                              │
││││  POST /v1/tokens/validate                                                      │
│  │   Body: { contentId, signature, protocol }                                    │
│  │   Response: { valid, payment: {...} }                                         │
│  │ ││  │ POST /v1/analytics/track                                                       │
│  │   Body: { endpoint, protocol, amount, payerAddress }                     │
│  │   Response: { success: true }                                                 │
││└─────────────────────────────────────────────────────────────────────────┘
```

---

## NPM Package Structure

```
@centsh/sdk
├── package.json
├── src/
│   ├── index.ts                 # Exports: init, protect, getAnalytics
│   ├── lib/
│   │   ├── protocols.ts         # X402Protocol, MPPChargeProtocol
│   │   ├── registry.ts           # ProtocolRegistry
│   │   └── analytics.ts          # Analytics tracking
│   └── types/
│       └── index.ts              # TypeScript types
├── dist/
│   ├── index.js
│   └── index.d.ts
└── README.md

@cent/hosted (future package for content upload)
├── src/
│   ├── upload.ts                # Content upload functions
│   └── download.ts               # Content download functions
└── ...
```

---

## Development Phases

### Phase 1: Core Infrastructure (Days 1-3)

```
Deliverables:
├── User authentication (wallet connection)
├── Protocol abstraction layer
│   ├── X402Protocol class
│   ├── MPPChargeProtocol class
│   └── ProtocolRegistry
├── Content upload (files + articles)
├── Payment flow (both protocols)
├── File storage (S3)
├── Basic analytics
└── Landing page + dashboard
```

### Phase 2: SDK Development (Days 4-5)

```
Deliverables:
├── @centsh/sdk npm package
├── init() function
├── protect() middleware
├── Protocol selection (x402 | mpp-charge)
├── Analytics tracking
├── TypeScript types
└── Documentation + examples
```

### Phase 3: Polish + Demo (Day 6)

```
Deliverables:
├── Error handling (both protocols)
├── Protocol selection UI (creator chooses)
├── Analytics by protocol
├── Demo video
├── README
└── Hackathon submission
```

---

## Success Metrics

| Metric                            | Target                        |
| --------------------------------- | ----------------------------- |
| Hosted content upload             | Working                       |
| x402 payment flow (testnet)       | Working                       |
| MPP Charge payment flow (testnet) | Working                       |
| SDK middleware (both protocols)   | Working                       |
| Protocol selection UI             | Working                       |
| Analytics dashboard               | Revenue + requests + protocol |

---

## Comparison Matrix

```
┌──────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Feature          │ cent      │ Gumroad         │ xpay.sh         │
├──────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Platform fee     │0%              │ 10% + $0.30     │ 1.5-2.5%        │
│ Settlement time  │ ~5 seconds      │ T+2 days        │ ~5 seconds      │
│ Protocol options │ x402, MPP Charge│ N/A        │ x402 only       │
│ Content hosting  │ Yes             │ Yes             │ No (API only)   │
│ API middleware   │ Yes (SDK)        │ No              │ Yes             │
│ Agent access      │ Yes (x402/MPP)  │ No              │ Yes (x402)      │
│ Analytics         │ Yes             │ Yes             │ Yes             │
│ Dashboard         │ Yes             │ Yes             │ Yes             │
│ Multi-protocol    │ Yes             │ N/A        │ No               │
│ No facilitator    │ MPP Charge      │ N/A        │ No               │
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## Quick Start Reference

```typescript
// ========================================
// Content Upload (Hosted)
// ========================================

// Upload file
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("title", "My Report");
formData.append("price", "0.05");
formData.append("protocol", "x402"); // or 'mpp-charge'

const response = await fetch("https://api.cent.dev/v1/content/upload", {
  method: "POST",
  headers: { Authorization: "Bearer toll_test_xxx" },
  body: formData,
});

const { contentId, paywallUrl } = await response.json();

// ========================================
// SDK Usage (API Protection)
// ========================================

import { init, protect } from "@centsh/sdk";

init({ apiKey: "toll_test_xxx" });

// x402 (default)
app.get("/api/data", protect({ price: 0.05 }), handler);

// MPP Charge (no facilitator)
app.get("/api/data", protect({ price: 0.05, protocol: "mpp-charge" }), handler);

// Dynamic pricing
app.post(
  "/api/ai",
  protect({
    price: (req) => req.body.tokens * 0.00001,
  }),
  handler,
);
```
