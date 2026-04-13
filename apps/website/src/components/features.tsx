import { Wallet, Brain, Zap, Radio } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Agent Skills",
    description:
      "Every command is a skill with trigger phrases. AI agents discover, route, and invoke the right tool automatically. No manual integration needed.",
  },
  {
    icon: Wallet,
    title: "Agentic Wallet",
    description:
      "Login, balance, transfer. Agents manage wallets end to end. OTP auth, key management, and session persistence built in.",
  },
  {
    icon: Zap,
    title: "x402 Payments",
    description:
      "Agents pay per API request via the HTTP 402 protocol. Micropayments on Stellar: fast, cheap, and built for machine-to-machine commerce.",
  },
  {
    icon: Radio,
    title: "Real-time Monitoring",
    description:
      "Stream transactions, payments, and effects via Horizon SSE. Agents watch the network and react to events as they happen.",
  },
];

export function Features() {
  return (
    <section className="inner border-x pt-16">
      <div className="px-8 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Built for agents,
          <br />
          usable by humans.
        </h2>
        <p className="text-muted text-lg max-w-lg">
          Every capability is structured, typed, and documented so AI agents can use it without
          hand-holding. You just run commands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[url(/features.jpg)] p-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-2xl p-6 bg-surface/90 backdrop-blur-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary">
              <feature.icon className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
            <p className="text-muted leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
