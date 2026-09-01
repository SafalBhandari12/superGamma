import type { Archetype, Slide } from "@supergamma/schema";
import { SAMPLE_SLIDES } from "./sampleDeck";

/**
 * One representative slide per archetype, used only to derive layout shape.
 *
 * The archetype catalogue on the landing page draws its wireframes by running
 * these through the real `tilesFor()`, so the little diagrams are the actual
 * grid the generator would produce — not a designer's impression of it. Text
 * content is irrelevant here; only the counts that layouts branch on (how many
 * stats, whether there's a takeaway, which timeline variant) matter.
 */
const byArchetype = (a: Archetype) => SAMPLE_SLIDES.find((s) => s.archetype === a)!;

export const ARCHETYPE_SAMPLES: Record<Archetype, Slide> = {
  hero: byArchetype("hero"),
  chart: byArchetype("chart"),
  statGrid: byArchetype("statGrid"),
  process: byArchetype("process"),
  comparison: byArchetype("comparison"),

  quadrant: {
    archetype: "quadrant",
    cells: [
      { label: "Build", heading: "Own the cell supply", body: "Vertical integration below 40 GWh." },
      { label: "Buy", heading: "Contract long-term", body: "Fixed price, no capital exposure." },
      { label: "Partner", heading: "Co-invest in lines", body: "Shared capex, shared offtake." },
      { label: "Wait", heading: "Ride the spot market", body: "Cheapest today, riskiest in 2028." },
    ],
  },
  featureGrid: {
    archetype: "featureGrid",
    label: "Platform",
    statement: "Every site runs the same control stack from day one.",
    features: [
      { heading: "Dispatch optimizer" },
      { heading: "Warranty telemetry" },
      { heading: "Market bidding" },
      { heading: "Remote firmware" },
    ],
  },
  diagram: {
    archetype: "diagram",
    label: "Where we win",
    sets: [{ label: "Cheap capital" }, { label: "Grid access" }, { label: "Software" }],
    overlapLabel: "Durable margin",
    statement: "Only sites with all three clear a 12% unlevered return.",
    proof: { label: "Return", value: "12.4%" },
  },
  timeline: {
    archetype: "timeline",
    variant: "series",
    label: "Buildout",
    milestones: [
      { when: "2024", label: "First 100 MW energized", detail: "Texas and Arizona" },
      { when: "2025", label: "Cost parity reached", detail: "Without tax credits" },
      { when: "2026", label: "Pipeline fully financed", detail: "Through 2028 sites" },
    ],
    metric: { name: "GW online", values: [4.8, 7.1, 10.6, 14.2, 18.4] },
  },
  closing: {
    archetype: "closing",
    title: "Fund the 2027 pipeline",
    subtitle: "We hold 2.1 GW under exclusivity and need capital to close it.",
    cta: "Book a diligence session",
    stats: [
      { label: "Raise", value: "$180M" },
      { label: "Pipeline", value: "2.1 GW" },
    ],
  },
};

/** Catalogue copy — what each archetype is *for*, in the order it's shown. */
export const ARCHETYPE_CATALOG: { archetype: Archetype; name: string; job: string }[] = [
  { archetype: "hero", name: "Hero", job: "Open with the claim and two numbers" },
  { archetype: "statGrid", name: "Stat grid", job: "One anchor metric, supported" },
  { archetype: "chart", name: "Chart", job: "Eleven chart forms, picked by job" },
  { archetype: "comparison", name: "Comparison", job: "Us versus them, with proof" },
  { archetype: "quadrant", name: "Quadrant", job: "Four peer options as a matrix" },
  { archetype: "featureGrid", name: "Feature grid", job: "One claim, four capabilities" },
  { archetype: "process", name: "Process", job: "Three to five ordered steps" },
  { archetype: "timeline", name: "Timeline", job: "Milestones on a real metric" },
  { archetype: "diagram", name: "Diagram", job: "Overlapping sets and the middle" },
  { archetype: "closing", name: "Closing", job: "The single next action" },
];
