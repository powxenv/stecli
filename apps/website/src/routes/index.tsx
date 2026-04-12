import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <>
      <main className="inner">
        <div className="py-30">
          <div className="grid grid-cols-2 gap-10 items-center">
            <h1 className="font-medium text-5xl leading-tight">
              Sell any digital product with micropayments.
            </h1>
            <p className="text-lg leading-relaxed text-gray-600">
              Monetize any digital product — APIs, content, software, data — with x402 and MPP
              Charge on Stellar. Pay per access, dynamic pricing, and analytics built in.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
