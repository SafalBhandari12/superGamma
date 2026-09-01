import type { Slide } from "@supergamma/schema";

/**
 * The landing page shows the real renderer, not a screenshot.
 *
 * These are hand-written slides in the exact shape `generateSlide` returns —
 * every field is inside the schema's length bounds — so the hero preview is
 * the same component the dashboard and the .pptx exporter read from. If the
 * renderer regresses, the marketing page breaks with it, which is the point.
 */
export const SAMPLE_SLIDES: Slide[] = [
  {
    archetype: "hero",
    eyebrow: "Series B · Q3 2026",
    title: "Grid storage stops being a pilot",
    subtitle: "Four-hour lithium systems now clear cost parity in eleven US markets.",
    stats: [
      { label: "Installed 2026", value: "18.4 GW" },
      { label: "Cost per kWh", value: "$114" },
    ],
    footerLeft: "Nordwind Energy",
    footerRight: "Confidential",
  },
  {
    archetype: "chart",
    label: "Deployment",
    chart: {
      kind: "column",
      points: [
        { label: "2022", value: 4.8 },
        { label: "2023", value: 7.1 },
        { label: "2024", value: 10.6 },
        { label: "2025", value: 14.2 },
        { label: "2026", value: 18.4 },
      ],
      emphasisIndex: 4,
      unit: "GW",
    },
    takeaway: "Annual additions have nearly quadrupled in four years.",
    sideStats: [{ label: "CAGR", value: "40%" }],
  },
  {
    archetype: "statGrid",
    leadLabel: "Levelized cost",
    leadValue: "$114/kWh",
    leadNote: "Pack prices fell 19% year over year as new LFP lines came online.",
    stats: [
      { label: "Round trip", value: "88%" },
      { label: "Cycle life", value: "6,000" },
      { label: "Payback", value: "5.2 yrs" },
    ],
  },
  {
    archetype: "process",
    label: "How a site ships",
    meta: "~14 months",
    steps: [
      { label: "Site", detail: "Interconnect queue entry" },
      { label: "Permit", detail: "County and fire review" },
      { label: "Build", detail: "Containers on poured slab" },
      { label: "Energize", detail: "Utility witness test" },
    ],
  },
  {
    archetype: "comparison",
    ours: {
      label: "LFP",
      heading: "Cheaper, cooler, longer-lived",
      points: ["Half the cell cost", "No cobalt supply risk", "6,000 cycles to 80%"],
    },
    theirs: {
      label: "NMC",
      heading: "Denser but pricier",
      points: ["Higher energy density", "Thermal management cost"],
    },
    proof: { label: "Cost gap", value: "31%", note: "lower $/kWh for LFP" },
  },
];

/**
 * Tab labels for the preview switcher, in plain English rather than archetype
 * ids — plus a line explaining the layout decision the visitor is looking at,
 * since the whole point of the tile is that these are decisions, not luck.
 */
export const SAMPLE_TABS: { label: string; caption: string }[] = [
  {
    label: "Title",
    caption: "The anchor takes four of six columns; the two opening numbers sit beside it.",
  },
  {
    label: "Chart",
    caption: "Columns, because the question is magnitude. One bar is emphasised; the rest go gray.",
  },
  {
    label: "Metrics",
    caption: "The lead metric gets roughly twice the area of anything supporting it.",
  },
  {
    label: "Process",
    caption: "Steps share one rail, so the eye reads order instead of hunting across tiles.",
  },
  {
    label: "Compare",
    caption: "Our side holds the anchor; the counterpoint and the proof stack beside it.",
  },
];
