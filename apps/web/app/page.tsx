import { CHART_KINDS, THEMES, THEME_IDS } from "@supergamma/schema";
import Link from "next/link";
import { ArchetypeMark } from "../src/components/landing/ArchetypeMark";
import {
  ARCHETYPE_CATALOG,
  ARCHETYPE_SAMPLES,
} from "../src/components/landing/archetypeSamples";
import { DeckPreview } from "../src/components/landing/DeckPreview";
import { Logomark, SiteNav } from "../src/components/landing/SiteNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <System />
        <HowItWorks />
        <Archetypes />
        <Themes />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — two lead tiles, four supporting. Size carries the hierarchy.  */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="rule-grid border-b border-line">
      <div className="mx-auto max-w-shell px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="tile animate-rise p-7 sm:p-10 lg:col-span-7">
            <span className="eyebrow">Prompt in, deck out</span>
            <h1 className="display mt-6 max-w-[15ch]">
              Describe the deck. Get one that looks designed.
            </h1>
            <p className="mt-6 max-w-measure text-lead text-muted">
              superGamma plans an outline, fills every slide against a bento grid, and picks chart
              forms from the shape of your data. No template stamping, no empty tiles, no
              screenshot of a chart you can&apos;t edit.
            </p>

            {/* A still of the dashboard's composer — the first thing you meet
                after signing in, shown here so the page and the app rhyme. */}
            <div className="mt-9 flex items-center gap-3 rounded-[12px] border border-line-strong bg-surface-2 p-2 pl-4">
              <span className="font-mono text-small text-faint" aria-hidden>
                ›
              </span>
              <span className="flex-1 truncate text-small text-ink-2">
                Series B deck for a grid-scale battery developer
              </span>
              <span className="hidden shrink-0 rounded-[8px] bg-ink px-3.5 py-2 text-micro font-medium uppercase tracking-[0.08em] text-on-tone sm:block">
                Generate
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link href="/sign-in" className="btn-primary px-5 py-3 text-body">
                Start building — free
              </Link>
              <a href="#archetypes" className="btn-secondary px-5 py-3 text-body">
                See all ten layouts
              </a>
            </div>
          </div>

          <div
            className="tile animate-rise p-5 sm:p-6 lg:col-span-5"
            style={{ animationDelay: "70ms" }}
          >
            <DeckPreview />
          </div>

          <StatTile
            className="lg:col-span-3"
            value="10"
            label="Archetypes"
            note="Layouts designed before the model ever sees them"
          />
          <StatTile
            className="lg:col-span-3"
            value="11"
            label="Chart forms"
            note="Chosen by the job the data has to do"
            surface="tone"
            tone="#C2410C"
          />
          <StatTile
            className="lg:col-span-3"
            value="5"
            label="Themes"
            note="Restyle a finished deck without regenerating it"
          />
          <StatTile
            className="lg:col-span-3"
            value=".pptx"
            label="Export"
            note="Editable shapes and text, never a flat image"
            surface="ink"
          />
        </div>
      </div>
    </section>
  );
}

function StatTile({
  value,
  label,
  note,
  className = "",
  surface = "plain",
  tone,
}: {
  value: string;
  label: string;
  note: string;
  className?: string;
  surface?: "plain" | "tone" | "ink";
  tone?: string;
}) {
  const filled = surface !== "plain";
  return (
    <div
      className={`tile flex flex-col justify-between gap-8 p-6 ${className}`}
      style={
        surface === "ink"
          ? { background: "#1F1B16", borderColor: "#1F1B16", color: "#FFF8F0" }
          : surface === "tone"
            ? { background: tone, borderColor: "transparent", color: "#FFF8F0" }
            : undefined
      }
    >
      <span
        className="font-mono text-label font-medium uppercase"
        style={{ color: filled ? "rgba(255,248,240,0.7)" : "#6E6558" }}
      >
        {label}
      </span>
      <div>
        <div className="figure text-[2.75rem] leading-none">{value}</div>
        <p
          className="mt-2.5 text-small"
          style={{ color: filled ? "rgba(255,248,240,0.82)" : "#6E6558" }}
        >
          {note}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* System — what actually makes the output hold up                     */
/* ------------------------------------------------------------------ */

function System() {
  return (
    <Section
      id="system"
      index="01"
      eyebrow="Under the deck"
      title="A design system, not a prompt wrapper"
      lead="The model only ever fills shapes that were designed first. Everything below is enforced in code, so a bad generation is rejected rather than shipped."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <article className="tile flex flex-col p-7 sm:p-8 lg:col-span-6">
          <span className="eyebrow">One source of layout truth</span>
          <h3 className="mt-4 text-heading font-semibold">
            The screen and the .pptx cannot drift apart
          </h3>
          <p className="mt-3.5 max-w-measure text-body text-muted">
            Tile placement is computed once, by one function. The React renderer turns it into CSS
            grid areas; the exporter turns the same tiles into inches on a 16:9 slide. Neither
            positions anything itself, so what you present is what you downloaded.
          </p>
          <PipelineMark />
        </article>

        <article
          className="tile flex flex-col p-7 lg:col-span-3"
          style={{ background: "#0F766E", borderColor: "transparent", color: "#FFF8F0" }}
        >
          <span className="font-mono text-label font-medium uppercase text-on-tone/70">Charts</span>
          <h3 className="mt-4 text-subhead font-semibold">Picked by job, not by taste</h3>
          <p className="mt-3 text-small text-on-tone/80">
            Magnitude gets columns, trend gets a line, part-to-whole gets a donut. Eleven forms,
            each the right answer to a different question.
          </p>
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
            {CHART_KINDS.map((kind) => (
              <li
                key={kind}
                className="rounded-[6px] border border-on-tone/25 px-2 py-1 font-mono text-micro uppercase tracking-[0.08em] text-on-tone/85"
              >
                {kind}
              </li>
            ))}
          </ul>
        </article>

        <article className="tile flex flex-col p-7 lg:col-span-3">
          <span className="eyebrow">Typography</span>
          <h3 className="mt-4 text-subhead font-semibold">Set for the back row</h3>
          <p className="mt-3 text-small text-muted">
            Six fixed steps, sized against the tile they sit in — so a stat reads as a stat whether
            it fills a quarter of the slide or a sixth.
          </p>
          <dl className="mt-auto space-y-2 pt-6 font-mono text-micro text-muted">
            {[
              ["Label", "14"],
              ["Body", "21"],
              ["Heading", "32"],
              ["Statement", "38"],
              ["Stat", "52"],
              ["Title", "66"],
            ].map(([name, size]) => (
              <div key={name} className="flex items-center gap-3">
                <dt className="w-[4.75rem] shrink-0 uppercase tracking-[0.08em]">{name}</dt>
                <dd className="h-px flex-1 bg-line" />
                <dd className="nums text-ink">{size}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="tile p-7 lg:col-span-4">
          <span className="eyebrow">Copy fits</span>
          <h3 className="mt-4 text-subhead font-semibold">Length is enforced, not requested</h3>
          <p className="mt-3 text-small text-muted">
            Every field has a hard bound and a check for sentences that stop mid-thought. A slide
            that runs long is rejected and rewritten before you see it — asking a model politely to
            be brief does not work.
          </p>
        </article>

        <article
          className="tile p-7 lg:col-span-4"
          style={{ background: "#C2410C", borderColor: "transparent", color: "#FFF8F0" }}
        >
          <span className="font-mono text-label font-medium uppercase text-on-tone/70">Colour</span>
          <h3 className="mt-4 text-subhead font-semibold">Data colours are never tile colours</h3>
          <p className="mt-3 text-small text-on-tone/80">
            Decorative fills are chosen to look right as large flat panels. Chart series are a
            separate set, validated for separation across colour-vision deficiencies in both light
            and dark themes.
          </p>
        </article>

        <article className="tile p-7 lg:col-span-4">
          <span className="eyebrow">Speed</span>
          <h3 className="mt-4 text-subhead font-semibold">Slides are filled in parallel</h3>
          <p className="mt-3 text-small text-muted">
            Once the outline exists, each slide is independent — so an eight-slide deck is roughly
            two round trips, not eight. They stream onto the canvas as they land.
          </p>
        </article>
      </div>
    </Section>
  );
}

/** Flat diagram: one layout function, two renderers. No gradient, no shadow. */
function PipelineMark() {
  return (
    <svg
      viewBox="0 0 320 96"
      className="mt-auto w-full max-w-[420px] pt-8"
      role="img"
      aria-label="One layout function feeds both the web renderer and the pptx exporter"
    >
      <rect x="0" y="30" width="118" height="36" rx="7" fill="#1F1B16" />
      <text
        x="59"
        y="53"
        textAnchor="middle"
        fill="#FFF8F0"
        fontFamily="Geist Mono, monospace"
        fontSize="13"
      >
        tilesFor()
      </text>

      <path d="M118 48 H160 V16 H194" stroke="#C6BCA9" strokeWidth="1.5" fill="none" />
      <path d="M118 48 H160 V80 H194" stroke="#C6BCA9" strokeWidth="1.5" fill="none" />

      <rect x="196" y="0" width="124" height="32" rx="7" fill="#FAF6EE" stroke="#DFD8CA" />
      <text x="258" y="20" textAnchor="middle" fill="#1F1B16" fontFamily="Geist, sans-serif" fontSize="12.5">
        CSS grid areas
      </text>
      <rect x="196" y="64" width="124" height="32" rx="7" fill="#FAF6EE" stroke="#DFD8CA" />
      <text x="258" y="84" textAnchor="middle" fill="#1F1B16" fontFamily="Geist, sans-serif" fontSize="12.5">
        Inches on a slide
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    n: "01",
    title: "Say what the deck is about",
    body: "One sentence is enough. Name the audience or the ask and the outline sharpens around it.",
  },
  {
    n: "02",
    title: "An outline is planned first",
    body: "Slide count and archetype per slide, chosen for the argument — before a single tile is filled.",
  },
  {
    n: "03",
    title: "Present it, or take it with you",
    body: "Full-screen presenter mode, or a .pptx whose text boxes and shapes are still editable.",
  },
];

function HowItWorks() {
  return (
    <Section
      index="02"
      eyebrow="Three steps"
      title="From a sentence to something you can present"
      lead="The whole loop takes about as long as it takes to write the prompt."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="tile-quiet p-7 sm:p-8">
            <span className="figure text-[1.75rem] leading-none text-terracotta">{step.n}</span>
            <h3 className="mt-5 text-subhead font-semibold">{step.title}</h3>
            <p className="mt-3 text-small text-muted">{step.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Archetype catalogue — wireframes drawn from the real layout engine   */
/* ------------------------------------------------------------------ */

function Archetypes() {
  return (
    <Section
      id="archetypes"
      index="03"
      eyebrow="The catalogue"
      title="Ten layouts, each with a job"
      lead="Every wireframe below is drawn by the same function that lays out your slides — including which tile carries the emphasis."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ARCHETYPE_CATALOG.map(({ archetype, name, job }) => (
          <article
            key={archetype}
            className="tile p-4 transition-colors duration-150 hover:border-line-strong"
          >
            <div className="rounded-[8px] border border-line bg-surface-2 p-2">
              <ArchetypeMark slide={ARCHETYPE_SAMPLES[archetype]} />
            </div>
            <h3 className="mt-4 text-small font-semibold text-ink">{name}</h3>
            <p className="mt-1 text-micro leading-relaxed text-muted">{job}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

function Themes() {
  return (
    <Section
      id="themes"
      index="04"
      eyebrow="Five themes"
      title="Re-theming never touches the words"
      lead="A theme is a full token set — canvas, three surface tiers, five decorative fills and a separate validated chart palette. Switching one repaints the deck; it does not regenerate it."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {THEME_IDS.map((id) => {
          const theme = THEMES[id];
          return (
            <article key={id} className="tile overflow-hidden">
              <div className="p-4" style={{ background: theme.colors.canvas }}>
                <div
                  className="rounded-[8px] p-3.5"
                  style={{
                    background: theme.colors.surface1,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div className="serif text-[1.5rem] leading-none" style={{ color: theme.colors.text }}>
                    Aa
                  </div>
                  <div className="mt-1.5 font-mono text-micro uppercase" style={{ color: theme.colors.muted }}>
                    Surface one
                  </div>
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  {theme.colors.tones.map((tone) => (
                    <i key={tone} className="h-6 flex-1 rounded-[4px]" style={{ background: tone }} />
                  ))}
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-line px-4 py-3.5">
                <span className="text-small font-semibold">{theme.name}</span>
                <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint">
                  {theme.mode}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function Closing() {
  return (
    <section className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20">
      <div className="rounded-panel p-9 sm:p-14" style={{ background: "#1F1B16", color: "#FFF8F0" }}>
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="font-mono text-label font-medium uppercase text-on-tone/60">
              Your turn
            </span>
            <h2 className="title-serif mt-5 max-w-[16ch]">Write one sentence. Walk in with a deck.</h2>
            <p className="mt-5 max-w-measure text-body text-on-tone/75">
              Free to start. Bring your own topic — the first outline lands in seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:col-span-4 lg:justify-end">
            <Link
              href="/sign-in"
              className="btn px-5 py-3 text-body"
              style={{ background: "#FFF8F0", color: "#1F1B16" }}
            >
              Start building
            </Link>
            <a
              href="#archetypes"
              className="btn border px-5 py-3 text-body"
              style={{ borderColor: "rgba(255,248,240,0.28)", color: "#FFF8F0" }}
            >
              Browse layouts
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-shell flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logomark size={18} />
          <span className="text-small font-semibold">superGamma</span>
          <span className="text-small text-faint">Bento-grid decks from one prompt</span>
        </div>
        <div className="flex items-center gap-5 text-small text-muted">
          <a href="#system" className="hover:text-ink">
            System
          </a>
          <a href="#archetypes" className="hover:text-ink">
            Archetypes
          </a>
          <Link href="/sign-in" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  id,
  index,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  index: string;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-label font-medium nums text-terracotta">{index}</span>
            <span className="h-px w-6 bg-line-strong" aria-hidden />
            <span className="eyebrow">{eyebrow}</span>
          </div>
          <h2 className="title-serif mt-5 max-w-[22ch]">{title}</h2>
          <p className="mt-5 max-w-measure text-lead text-muted">{lead}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
