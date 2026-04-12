import { buttonVariants } from "@heroui/react";
import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react";
import { Link } from "@tanstack/react-router";

const Header = () => {
  return (
    <header className="fixed -translate-x-1/2 left-1/2 rounded-3xl bg-white border top-4 z-10 max-w-xl w-full">
      <div className="pr-2 pl-4 h-12 flex items-center">
        <Link to="/" className="font-bold text-lg -tracking-wider">
          Cent
        </Link>
        <nav className="flex-1 flex justify-end items-center gap-6">
          <Link
            className="text-sm text-foreground/80 decoration-wavy hover:underline hover:text-foreground"
            to="/"
          >
            Discover
          </Link>
          <Link
            className="text-sm text-foreground/80 decoration-wavy hover:underline hover:text-foreground"
            to="/"
          >
            Pricing
          </Link>
          <Link
            className="text-sm text-foreground/80 decoration-wavy hover:underline hover:text-foreground"
            to="/"
          >
            Docs
          </Link>
          <Link
            className="text-sm text-foreground/80 decoration-wavy hover:underline hover:text-foreground"
            to="/"
          >
            About
          </Link>
          <SignedIn>
            <Link to="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Open Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link to="/auth" className={buttonVariants()}>
              Sign In
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
};

export default Header;
