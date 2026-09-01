"use client";

import { THEMES } from "@supergamma/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { useDeckStore } from "../../store/deckStore";
import { Logomark } from "../landing/SiteNav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { history, deckId, status, reset, openFromHistory } = useDeckStore();

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface-2">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logomark size={20} />
          <span className="text-small font-semibold tracking-[-0.01em]">superGamma</span>
        </Link>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            reset();
            onNavigate?.();
          }}
          disabled={status === "generating"}
          className="btn-primary w-full"
        >
          <span aria-hidden>+</span> New deck
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="eyebrow px-1 py-2">This session</p>
        {history.length === 0 ? (
          <p className="px-1 pt-1 text-micro leading-relaxed text-faint">
            Decks you generate appear here. They live in this tab only — nothing is saved to an
            account yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {history.map((deck) => {
              const active = deck.id === deckId;
              return (
                <li key={deck.id}>
                  <button
                    type="button"
                    onClick={() => {
                      openFromHistory(deck.id);
                      onNavigate?.();
                    }}
                    className={`w-full rounded-[10px] border px-3 py-2.5 text-left transition-colors duration-150 ${
                      active
                        ? "border-line-strong bg-surface"
                        : "border-transparent hover:bg-surface-3"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <i
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ background: THEMES[deck.themeId].colors.tones[0] }}
                        aria-hidden
                      />
                      <span className="truncate text-small font-medium">{deck.title}</span>
                    </span>
                    <span className="mt-1 block pl-[18px] font-mono text-micro text-faint">
                      {deck.slides.length} slides · {THEMES[deck.themeId].name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2.5 px-1 pb-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-micro font-semibold uppercase text-on-tone">
            {(session?.user?.name || session?.user?.email || "?").slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small font-medium">
              {session?.user?.name || "Signed in"}
            </span>
            <span className="block truncate text-micro text-faint">{session?.user?.email}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut();
            router.push("/sign-in");
            router.refresh();
          }}
          className="btn-ghost w-full justify-start px-3 py-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
