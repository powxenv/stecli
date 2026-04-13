"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import HugeiconsUser from "~icons/hugeicons/user";
import HugeiconsChatBot from "~icons/hugeicons/chat-bot";
import HugeiconsTools from "~icons/hugeicons/tools";
import HugeiconsLoading03 from "~icons/hugeicons/loading-03";

const AGENT_PROMPT = "Read http://stecli.noval.me/AGENTS.md, then set it up for me.";

const CHAT_MESSAGES = [
  {
    role: "user",
    icon: HugeiconsUser,
    text: "Read http://stecli.noval.me/AGENTS.md, then set it up for me.",
  },
  {
    role: "bot",
    icon: HugeiconsChatBot,
    text: "I've read the guide. Would you like me to set up an agentic wallet? If so, share your email and I'll send an OTP.",
  },
  {
    role: "user",
    icon: HugeiconsUser,
    text: "email: xxxxx@xxx.com",
  },
  {
    role: "tool",
    icon: HugeiconsTools,
    text: "Running npx stecli wallet login -e xxxxx@xxx.com",
  },
  {
    role: "bot",
    icon: HugeiconsChatBot,
    text: "OTP sent to your email. Please share it so I can verify.",
  },
  {
    role: "user",
    icon: HugeiconsUser,
    text: "123456",
  },
  {
    role: "tool",
    icon: HugeiconsTools,
    text: "Running npx stecli wallet verify -e xxxxx@xxx.com -o 123456",
  },
  {
    role: "bot",
    icon: HugeiconsChatBot,
    text: "Verified! Your Stellar address is G12345XXXXXXXXXXXXXX. Your wallet is ready — I can now perform operations on the Stellar network.",
  },
] as const;

export function Hero() {
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [thinkingIndex, setThinkingIndex] = useState<number | null>(null);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let delay = 0.3;

    for (let i = 0; i < CHAT_MESSAGES.length; i++) {
      const msg = CHAT_MESSAGES[i];
      const capturedI = i;

      if (msg.role === "user") {
        timeouts.push(
          setTimeout(() => {
            setThinkingIndex(null);
            setRevealedIndices((prev) => new Set([...prev, capturedI]));
          }, delay * 1000),
        );
        delay += 0.4;
      } else {
        timeouts.push(
          setTimeout(() => {
            setThinkingIndex(capturedI);
          }, delay * 1000),
        );
        delay += 0.8;

        timeouts.push(
          setTimeout(() => {
            setThinkingIndex(null);
            setRevealedIndices((prev) => new Set([...prev, capturedI]));
          }, delay * 1000),
        );
        delay += 0.3;
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <section className="inner min-h-lvh pt-40 border-x">
      <div className="max-w-3xl flex flex-col items-center text-center mx-auto">
        <div className="px-8 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            The agent-first CLI
            <br />
            for Stellar.
          </h1>

          <p className="text-lg md:text-xl text-muted leading-relaxed max-w-xl mb-10">
            Wallet, payments, markets, monitoring. All structured as agent skills. Point any AI at
            Stecli and it knows what to do.
          </p>
        </div>

        <div className="mb-12 max-w-3xl mx-auto w-full">
          <p className="text-sm text-muted mb-3 font-medium">
            Copy this prompt. Paste it into any AI agent.
          </p>
          <CopyablePrompt />
        </div>
      </div>

      <div className="bg-[url(/hero.jpg)] bg-cover flex flex-col items-center justify-center p-8">
        <style>{`
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="max-w-3xl w-full flex flex-col gap-2">
          {CHAT_MESSAGES.map((msg, i) => {
            const Icon = msg.icon;
            const isUser = msg.role === "user";
            const isRevealed = revealedIndices.has(i);
            const isThinking = thinkingIndex === i;
            const visible = isRevealed || isThinking;

            return (
              <div
                key={i}
                className={`flex gap-1 ${isUser ? "self-end" : ""} ${visible ? "" : "invisible"}`}
                style={visible ? { animation: "fadeInDown 0.4s ease-out forwards" } : undefined}
              >
                {!isUser && (
                  <div className="size-10 shrink-0 rounded-full bg-surface/80 backdrop-blur-2xl flex items-center justify-center">
                    {isThinking ? <HugeiconsLoading03 className="animate-spin" /> : <Icon />}
                  </div>
                )}
                <div className="max-w-xl bg-surface/80 backdrop-blur-2xl overflow-hidden p-4 rounded-2xl relative">
                  <span className={isThinking ? "invisible" : ""}>{msg.text}</span>
                  {isThinking && (
                    <span className="absolute inset-0 flex items-center p-4">Thinking...</span>
                  )}
                </div>
                {isUser && (
                  <div className="size-10 shrink-0 rounded-full bg-surface/80 backdrop-blur-2xl flex items-center justify-center">
                    <Icon />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CopyablePrompt() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = AGENT_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
