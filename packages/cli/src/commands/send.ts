import { defineCommand } from "citty";
import { confirm, isCancel, cancel } from "@clack/prompts";
import { Effect } from "effect";
import { runApp } from "#/lib/run.js";
import { OutputService } from "#/services/output.js";
import { WalletClientService } from "#/services/wallet-client.js";
import { StellarService } from "#/services/stellar.js";
import type { Network } from "#/domain/types.js";

export const sendCommand = defineCommand({
  meta: { name: "send", description: "Send a payment to another Stellar address" },
  args: {
    destination: {
      type: "positional",
      description: "Destination public key (G...)",
      required: true,
    },
    amount: {
      type: "positional",
      description: "Amount to send",
      required: true,
    },
    asset: {
      type: "string",
      alias: ["a"],
      description: "Asset to send: 'native' (default) or 'CODE:ISSUER' for custom assets",
      default: "native",
    },
    memo: {
      type: "string",
      alias: ["m"],
      description: "Transaction memo (optional)",
    },
    network: {
      type: "string",
      alias: ["n"],
      description: "Network: testnet or pubnet",
      default: "testnet",
    },
  },
  async run({ args }) {
    const network = args.network as Network;
    if (network !== "testnet" && network !== "pubnet") {
      console.log(
        JSON.stringify(
          { ok: false, error: "Invalid network. Must be 'testnet' or 'pubnet'." },
          null,
          2,
        ),
      );
      return;
    }

    const asset = args.asset as string;
    const amount = args.amount as string;
    if (asset === "native" && Number.parseFloat(amount) > 100) {
      const shouldContinue = await confirm({
        message: `You are about to send ${amount} XLM. Continue?`,
      });
      if (isCancel(shouldContinue) || !shouldContinue) {
        cancel("Payment cancelled.");
        return;
      }
    }

    const program = Effect.gen(function* () {
      const output = yield* OutputService;
      const walletClient = yield* WalletClientService;
      const stellar = yield* StellarService;
      const wallet = yield* walletClient.fetchWallet();
      const result = yield* stellar.sendPayment(
        wallet.secretKey,
        args.destination as string,
        args.amount as string,
        args.asset as string,
        network,
        args.memo as string | undefined,
      );
      yield* output.print(output.ok(result));
    }).pipe(
      Effect.catchTags({
        WalletNotFoundError: () =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err("No wallet found. Run `stecli wallet login` first."));
          }),
        WalletFetchError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Failed to fetch wallet: ${e.cause}`));
          }),
        StellarAccountError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Account error: ${e.cause}`));
          }),
        StellarTransactionError: (e) =>
          Effect.gen(function* () {
            const output = yield* OutputService;
            yield* output.print(output.err(`Transaction failed: ${e.cause}`));
          }),
      }),
    );
    await runApp(program, "send");
  },
});
