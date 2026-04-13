"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const AGENT_PROMPT = "Read http://stelagent.noval.me/AGENTS.md, then set it up for me.";

export function GetStarted() {
  return (
    <section className="inner py-16 px-8 border-x">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            One prompt.
            <br />
            Any agent.
          </h2>
          <p className="text-muted text-lg leading-relaxed mb-8">
            Stelagent ships an AGENTS.md that any AI can read and act on immediately. No setup, no
            configuration. Just point your agent at it.
          </p>
          <AgentPromptBox />
        </div>

        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Or run it yourself.
          </h2>
          <p className="text-muted text-lg leading-relaxed mb-8">
            No install required. Always the latest version. Structured JSON output that humans and
            machines can both read.
          </p>

          <div className="rounded-xl border border-border bg-surface p-5 mb-4">
            <code className="text-sm font-mono">
              <span className="text-muted">$</span> <span className="text-success">npx</span>{" "}
              stelagent wallet login -e you@example.com
            </code>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <code className="text-sm font-mono">
              <span className="text-muted">$</span> <span className="text-success">npx</span>{" "}
              stelagent pay https://api.example.com/premium
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentPromptBox() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = AGENT_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative w-full cursor-pointer rounded-xl border border-border bg-surface-secondary text-left transition-colors hover:bg-surface-tertiary"
    >
      <div className="flex items-start gap-3 p-5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted group-hover:text-foreground transition-colors" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm md:text-base text-foreground leading-relaxed break-words">
            {AGENT_PROMPT}
          </p>
        </div>
      </div>
    </button>
  );
}
