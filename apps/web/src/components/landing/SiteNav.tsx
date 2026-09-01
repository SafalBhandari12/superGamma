"use client";

import Link from "next/link";
import { authClient } from "../../lib/auth-client";

const LINKS = [
  { href: "#system", label: "System" },
  { href: "#archetypes", label: "Archetypes" },
  { href: "#themes", label: "Themes" },
];

export function SiteNav() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-shell items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logomark />
          <span className="text-body font-semibold tracking-[-0.01em]">superGamma</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-[8px] px-3 py-2 text-small text-muted transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Rendered only once the session resolves — a CTA that flips from
              "Sign in" to "Open dashboard" a beat after paint is worse than one
              that arrives a beat late. */}
          {isPending ? (
            <span className="h-9 w-28 rounded-[10px] bg-surface-3" aria-hidden />
          ) : session?.user ? (
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/sign-in" className="btn-primary">
                Start building
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

/**
 * Four bento tiles at a glance — the grid is the mark. The anchor tile is ink,
 * which disappears on the ink panels, so `onDark` swaps just that one square.
 */
export function Logomark({ size = 22, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="0" y="0" width="13" height="13" rx="3" fill={onDark ? "#FFF8F0" : "#1F1B16"} />
      <rect x="15" y="0" width="9" height="9" rx="2.5" fill="#C2410C" />
      <rect x="15" y="11" width="9" height="13" rx="2.5" fill="#0F766E" />
      <rect x="0" y="15" width="13" height="9" rx="2.5" fill="#CA8A04" />
    </svg>
  );
}
