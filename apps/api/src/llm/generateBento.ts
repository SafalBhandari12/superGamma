import {
  BENTO_ARCHETYPE_SCHEMAS,
  BentoOutlineSchema,
  BentoSlideSchema,
  bentoOutlineResponseFormat,
  bentoSlideResponseFormats,
  type BentoArchetype,
  type BentoOutline,
  type BentoSlide,
} from "@supergamma/schema";
import { z } from "zod";
import { config } from "../config.js";
import { openai } from "./client.js";

/**
 * The archetype catalog, written as selection rules rather than descriptions —
 * the model's job is to match content shape to the tile shape that holds it.
 */
const ARCHETYPE_CATALOG = `
- hero: opening slide. Deck title, one-line thesis, and exactly TWO headline numbers.
- statGrid: one dominant number plus 3-5 supporting metrics. Use when the story IS the numbers.
- chart: one chart carries the slide. Pick the chart kind by the job the data does (rules below).
- quadrant: exactly four peer concepts — SWOT, a 2x2 framework, or the four parts of a system.
- featureGrid: one statement plus exactly four capabilities named in 2-4 words each.
- diagram: 2-3 overlapping sets and what the overlap means. Only when overlap is the actual point.
- process: 3-5 sequential steps, each with a short "how" detail. A pipeline or lifecycle.
- timeline: milestones over time. Pick a variant: "series" (milestones on a metric curve — needs
  the metric array; the strongest choice when a number grew over the period), "swimlane" (phases
  with duration and overlap — needs lanes), "rail" (an aligned ledger of dated milestones).
- comparison: us vs an alternative, plus ONE proof number that settles it.
- closing: the ending. A restated thesis and a call to action.
`.trim();

/**
 * Chart-form selection, straight from data-viz practice: the data's job picks
 * the form. Getting this wrong is the most common way a generated deck looks
 * amateur — a pie of two slices, or a one-bar bar chart where a number belongs.
 */
const CHART_RULES = `
Chart kind is chosen by the JOB the data does, never by what looks nice:
- column: compare magnitude across 2-7 short-named categories. Set emphasisIndex when ONE bar is
  the story — the others then render gray. This "emphasis" treatment is the most underused and
  usually the most honest.
- bar: same job, but use it the moment category names are long enough to wrap.
- line: a trend over time with 1-3 named series.
- area: a trend over time, single series only.
- donut: part-to-whole with 2-5 slices that sum to a whole.
- waffle: a single share expressed as countable units out of 100 ("62 of every 100 farms").
- diverging: values above and below a baseline — gains and losses together. Values may be negative.
- bullet: actual against target, 1-4 measures.
- dumbbell: the same items measured before and after.
- funnel: 3-5 ordered stages with drop-off between them.
- gantt: 2-5 workstreams with duration and overlap, positioned 0-100 along the axis.

Never emit a chart for a single number — that is a stat tile, and the hero/statGrid archetypes
already hold it. Never invent precise-looking figures you cannot support; prefer round, clearly
illustrative numbers.
`.trim();

async function callStructured<T>(
  schema: z.ZodType<T>,
  responseFormat: {
    type: "json_schema";
    json_schema: { name: string; schema: Record<string, unknown> };
  },
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await openai.chat.completions.create({
      model: config.openaiModel,
      messages,
      response_format: responseFormat,
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: "That wasn't valid JSON. Return valid JSON only." });
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) return result.data;

    messages.push({ role: "assistant", content: raw });
    messages.push({
      role: "user",
      content: `That didn't match the required schema: ${result.error.message}. Fix it and return valid JSON only.`,
    });
  }

  throw new Error("Model failed to produce schema-valid output after repair attempt.");
}

export async function generateBentoOutline(prompt: string): Promise<BentoOutline> {
  return callStructured(
    BentoOutlineSchema,
    bentoOutlineResponseFormat,
    `You plan bento-grid presentations. Given a topic, produce a deck title and an ordered outline.
Each outline item picks ONE archetype and states, in one sentence, what that slide must say.

${ARCHETYPE_CATALOG}

Rules:
- 6-8 slides. Open with "hero". Close with "closing".
- Vary the archetypes: never the same one twice in a row, and never more than two of any archetype
  in the deck. A deck that is all statGrid and featureGrid reads as a template.
- Include at least one "chart" whenever the topic has anything quantitative in it.
- The brief is a pointer for the next step, not the slide's copy. Under 180 characters.`,
    `Topic: ${prompt}`
  );
}

export async function generateBentoSlide(
  archetype: BentoArchetype,
  brief: string,
  deckTitle: string,
  prompt: string
): Promise<BentoSlide> {
  const slide = await callStructured(
    BENTO_ARCHETYPE_SCHEMAS[archetype] as z.ZodType<BentoSlide>,
    bentoSlideResponseFormats[archetype],
    `You are filling in ONE slide of a bento-grid deck titled "${deckTitle}" about: ${prompt}

The slide MUST use archetype "${archetype}" — set the "archetype" field to exactly that value.

${CHART_RULES}

Writing rules — this is a slide, not a document:
- Every field has a hard character limit. Write to roughly HALF of it. Bento type is set at
  presentation scale, so a tile holds far less than a web card; text that overflows is the single
  worst failure mode in this system.
- Headings are phrases, not sentences. Labels are 1-3 words. Never end a label with a period.
- Numbers belong in the stat/value fields as short display strings ("40%", "$12M", "6.2M"),
  never spelled out in prose.
- Be specific to the topic. Generic filler ("innovative solutions", "key benefits") is a failure.`,
    `This slide's job: ${brief}`
  );

  if (slide.archetype !== archetype) {
    throw new Error(`Model returned archetype "${slide.archetype}", expected "${archetype}".`);
  }
  return BentoSlideSchema.parse(slide);
}
