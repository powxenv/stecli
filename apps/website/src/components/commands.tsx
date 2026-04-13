import { Cpu, Eye, Radio, ArrowRight } from "lucide-react";

const commands = [
  {
    group: "wallet",
    items: [
      { cmd: "npx stelagent wallet login -e you@example.com", desc: "Request OTP" },
      { cmd: "npx stelagent wallet verify -e you@example.com -o 123456", desc: "Verify OTP" },
      { cmd: "npx stelagent wallet address", desc: "Show public key" },
      { cmd: "npx stelagent wallet balance", desc: "Check balances" },
      { cmd: "npx stelagent wallet transfer -t GDXXX... -a 10", desc: "Send XLM" },
      { cmd: "npx stelagent wallet logout", desc: "Clear session" },
    ],
  },
  {
    group: "account",
    items: [
      { cmd: "npx stelagent account details <address>", desc: "Account info" },
      { cmd: "npx stelagent account transactions <address>", desc: "TX history" },
      { cmd: "npx stelagent account payments <address>", desc: "Payment history" },
      { cmd: "npx stelagent account effects <address>", desc: "Account effects" },
    ],
  },
  {
    group: "assets",
    items: [
      { cmd: "npx stelagent assets search -c USDC", desc: "Search assets" },
      { cmd: "npx stelagent assets orderbook -s native -b USDC:GAXYZ...", desc: "Order book" },
    ],
  },
  {
    group: "payments",
    items: [
      { cmd: "npx stelagent send GDXXX... 100 -a USDC:GAXYZ...", desc: "Send asset" },
      { cmd: "npx stelagent pay https://api.example.com/premium", desc: "x402 micropayment" },
    ],
  },
  {
    group: "network",
    items: [{ cmd: "npx stelagent fee", desc: "Fee stats" }],
  },
  {
    group: "monitor",
    items: [
      { cmd: "npx stelagent monitor transactions <address>", desc: "Stream TXs" },
      { cmd: "npx stelagent monitor payments <address>", desc: "Stream payments" },
      { cmd: "npx stelagent monitor effects <address>", desc: "Stream effects" },
    ],
  },
];

const skillGroups = [
  {
    icon: Cpu,
    name: "Authentication",
    capabilities: ["Wallet login via email OTP", "Session management and recovery"],
  },
  {
    icon: Eye,
    name: "Querying",
    capabilities: [
      "Account details and history",
      "Asset search and order books",
      "Network fee stats",
    ],
  },
  {
    icon: ArrowRight,
    name: "Transacting",
    capabilities: ["XLM and custom asset transfers", "x402 micropayments for API access"],
  },
  {
    icon: Radio,
    name: "Monitoring",
    capabilities: ["Real-time streaming via Horizon SSE", "Transactions, payments, and effects"],
  },
];

export function Commands() {
  return (
    <section className="inner border-x">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 py-16">
          <div className="px-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Agents know what to do.
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-8">
              A single skill — <span className="font-mono text-foreground">stelagent-cli</span> —
              covers the full Stellar surface. AI agents match intent to action automatically,
              and&nbsp;expose the same commands as an MCP server for tool-use.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm px-8 font-semibold uppercase tracking-wider text-muted">
              Skill Capabilities
            </h3>
            {skillGroups.map((group) => (
              <div
                key={group.name}
                className="flex items-start gap-3 py-3 border-y border-border px-8"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-secondary">
                  <group.icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{group.name}</p>
                  <p className="text-xs text-muted mt-0.5">{group.capabilities.join(" · ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-7 bg-[url(/hero.jpg)] bg-cover bg-center p-8">
          <div className="space-y-2">
            {commands.map((group) => (
              <div
                key={group.group}
                className="bg-surface/80 backdrop-blur-2xl rounded-2xl overflow-hidden"
              >
                <p className="text-sm capitalize px-6 py-3">{group.group} Commands</p>
                <div className="space-y-1.5 font-mono text-sm bg-surface/20 p-6 rounded-t-2xl">
                  {group.items.map((item) => (
                    <div
                      key={item.cmd}
                      className="flex items-baseline justify-between gap-4 py-1.5"
                    >
                      <code className="text-foreground text-[13px] truncate">{item.cmd}</code>
                      <span className="text-muted text-xs shrink-0">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
