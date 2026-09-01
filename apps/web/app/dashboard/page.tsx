"use client";

import { useState } from "react";
import { Composer } from "../../src/components/dashboard/Composer";
import { DeckStage } from "../../src/components/dashboard/DeckStage";
import { Sidebar } from "../../src/components/dashboard/Sidebar";
import { ThemePanel } from "../../src/components/dashboard/ThemePanel";
import { Logomark } from "../../src/components/landing/SiteNav";
import { useDeckStore } from "../../src/store/deckStore";

export default function DashboardPage() {
  const { status, slides, deckTitle } = useDeckStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The stage owns the screen as soon as there is something to show — which
  // includes the moment generation starts, so the outline and the progress bar
  // land in the same place the slides will.
  const showStage = slides.length > 0 || status === "generating";

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <aside className="hidden w-[264px] shrink-0 md:block">
        <Sidebar />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/35"
          />
          <div className="absolute inset-y-0 left-0 w-[264px]">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col bg-canvas">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface-2 px-4 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost px-2 py-1.5"
            aria-label="Open menu"
          >
            ☰
          </button>
          <Logomark size={18} />
          <span className="truncate text-small font-semibold">{deckTitle ?? "superGamma"}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {showStage ? (
            <DeckStage />
          ) : (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <Composer />
            </div>
          )}
        </div>
      </main>

      {/* Only before a deck exists. Once slides are on the stage they need the
          width more than the palette does, and theming moves to the stage
          header. Below xl the composer carries its own inline theme row. */}
      {!showStage && (
        <aside className="hidden w-[300px] shrink-0 xl:block">
          <ThemePanel />
        </aside>
      )}
    </div>
  );
}
