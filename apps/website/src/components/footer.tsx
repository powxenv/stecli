import { StelagentLogo } from "./logo";

export function Footer() {
  return (
    <footer className="inner border-x px-8 py-8 border-t border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <StelagentLogo className="h-5 w-5" />
          <span className="text-sm text-muted">Stelagent: Agent-first CLI for Stellar</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Stellar
          </a>
          <a
            href="https://developers.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Horizon API
          </a>
          <a
            href="https://github.com/powxenv/stelagent"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
