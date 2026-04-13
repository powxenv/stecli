import { StelagentLogo } from "./logo";

export function Navbar() {
  return (
    <nav className="inner flex items-center justify-between py-6 fixed top-0 inset-x-0 border-x px-8 border-b bg-background/60 backdrop-blur-2xl z-10">
      <div className="flex items-center gap-2.5">
        <StelagentLogo className="h-8 w-8" />
        <span className="text-lg font-semibold tracking-tight text-foreground">Stelagent</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://developers.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Stellar Docs
        </a>
      </div>
    </nav>
  );
}
