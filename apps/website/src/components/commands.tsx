import { Cpu, Eye, Server, ArrowRight } from "lucide-react";

const commands = [
  {
    group: "wallet",
    items: [
      { cmd: "npx stecli wallet login -e you@example.com", desc: "OTP login" },
      { cmd: "npx stecli wallet address", desc: "Show public key" },
      { cmd: "npx stecli wallet balance", desc: "Check balances" },
      { cmd: "npx stecli wallet transfer -t GDXXX... -a 10", desc: "Send XLM" },
      { cmd: "npx stecli wallet logout", desc: "Clear session" },
    ],
  },
  {
    group: "account",
    items: [
      { cmd: "npx stecli account details <address>", desc: "Account info" },
      { cmd: "npx stecli account transactions <address>", desc: "TX history" },
      { cmd: "npx stecli account payments <address>", desc: "Payment history" },
      { cmd: "npx stecli account effects <address>", desc: "Account effects" },
    ],
  },
  {
    group: "assets",
    items: [
      { cmd: "npx stecli assets search --code USDC", desc: "Search assets" },
      { cmd: "npx stecli assets orderbook --selling XLM --buying USDC", desc: "Order book" },
    ],
  },
  {
    group: "actions",
    items: [
      { cmd: "npx stecli send <destination> <amount> --asset native", desc: "Send payment" },
      { cmd: "npx stecli pay https://api.example.com/premium", desc: "x402 micropayment" },
      { cmd: "npx stecli fee", desc: "Current fee stats" },
    ],
  },
  {
    group: "monitor",
    items: [
      { cmd: "npx stecli monitor transactions <address>", desc: "Stream TXs" },
      { cmd: "npx stecli monitor payments <address>", desc: "Stream payments" },
      { cmd: "npx stecli monitor effects <address>", desc: "Stream effects" },
    ],
  },
];

const skills = [
  {
    icon: Cpu,
    name: "stellar-wallet",
    triggers: ["wallet", "balance", "transfer", "login"],
  },
  {
    icon: Eye,
    name: "stellar-account",
    triggers: ["account", "transactions", "payments", "effects"],
  },
  {
    icon: Server,
    name: "stellar-monitor",
    triggers: ["stream", "watch", "real-time", "SSE"],
  },
  {
    icon: ArrowRight,
    name: "stellar-pay",
    triggers: ["pay", "x402", "micropayment", "send"],
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
              Each command is a skill with declared trigger phrases. AI agents match intent to
              action automatically, and&nbsp;expose the same surface as an MCP server for tool-use.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm px-8 font-semibold uppercase tracking-wider text-muted">
              Skill Definitions
            </h3>
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-start gap-3 py-3 border-y border-border px-8"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-secondary">
                  <skill.icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm font-mono">{skill.name}</p>
                  <p className="text-xs text-muted mt-0.5">triggers: {skill.triggers.join(", ")}</p>
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
