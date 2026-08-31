import {
  GeneratedOutlineSchema,
  outlineResponseFormat,
  Slide,
  SlideLayout,
  SlideSchema,
  slideContentResponseFormats,
  type GeneratedOutline,
} from "@supergamma/schema";
import { z } from "zod";
import { config } from "../config.js";
import { openai } from "./client.js";

const LAYOUT_CATALOG_DESCRIPTION = `
Layouts you can choose from, and when to use each:
- title: opening or section-break slide. Just a title (+ optional subtitle).
- bullets: 2-6 short points under one idea.
- two-column: a comparison or before/after — two parallel lists.
- big-stat: one number the audience should remember, with a short label.
- quote: a single quotation with an optional attribution.
- agenda: 3-6 topics/sections with a short title and one-line description each — a table-of-contents or overview slide.
- timeline: 3-5 steps or phases that happen in sequence, each with a label AND a one-line description — a detailed process, roadmap, or journey.
- process: 3-6 steps in sequence with ONLY a short label each (no room for a description) — a compact flow shown as arrows, e.g. a pipeline or lifecycle stage names.
- table: a comparison or data table, 2-4 columns and 2-6 rows.
- chart: 2-6 labeled data points, each a percentage (0-100) — use "bar" for comparing values across categories, "donut" for values that read as a share/proportion (e.g. multiple completion rates or scores).
- comparison: 2-4 pricing/plan/package tiers, each with a name, a price (or short value string), and 2-6 features — use for pricing plans, package tiers, or ranked option sets.
- quadrant: a 2x2 strategic framework (e.g. SWOT) — four labeled cells, each with 1-4 short items.
- team: 2-6 people, each with a name and a SHORT role title (e.g. "CEO", "Engineering Lead" — not a sentence) — "who's involved" or "meet the team" slides.

Prefer variety: don't lean on "bullets" for everything. Use "table" for anything comparative (options, tiers, before/after), "timeline" for a sequence that needs explanation per step, "process" for a short-label sequence, "agenda" for a topic overview, "chart" whenever the content is numeric/quantitative rather than prose, "comparison" for pricing/tiers, "quadrant" for a strategic 2x2 framework, and "team" whenever people and their roles are the actual content.
`.trim();

/**
 * Generic "generate, validate against the schema, and if it's wrong tell
 * the model exactly why and ask once more" — the loop the article calls
 * generate-validate-repair. Zod is the actual gate; the JSON-schema
 * response_format just makes the first attempt more likely to pass it.
 */
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
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: "That wasn't valid JSON. Return valid JSON only." });
      continue;
    }

    const result = schema.safeParse(parsedJson);
    if (result.success) return result.data;

    messages.push({ role: "assistant", content: raw });
    messages.push({
      role: "user",
      content: `That didn't match the required schema: ${result.error.message}. Fix it and return valid JSON only.`,
    });
  }

  throw new Error("Model failed to produce schema-valid output after repair attempt.");
}

export async function generateOutline(topic: string): Promise<GeneratedOutline> {
  return callStructured(
    GeneratedOutlineSchema,
    outlineResponseFormat,
    `You are a presentation writer. Given a topic, produce a deck title and an ordered slide outline. Each outline item picks ONE layout from the catalog and a one-sentence summary of what that slide should say.\n\n${LAYOUT_CATALOG_DESCRIPTION}\n\nKeep it to 5-8 slides. Open with "title", don't end on "big-stat" alone — close with something that reads as an ending. Keep each summary under 140 characters — it's a pointer for the next step, not the slide's actual content.`,
    `Topic: ${topic}`
  );
}

export async function generateSlide(
  layout: SlideLayout,
  summary: string,
  deckTitle: string
): Promise<Slide> {
  const slide = await callStructured(
    SlideSchema,
    slideContentResponseFormats[layout],
    `You are filling in ONE slide of a deck titled "${deckTitle}". The slide MUST use layout "${layout}" — set the "layout" field to exactly that value and fill only the fields that layout requires.\n\n${LAYOUT_CATALOG_DESCRIPTION}\n\nEvery field has a hard character limit in the schema. Write tight, presentation-length text (short phrases, not paragraphs) — when in doubt, shorter.`,
    `This slide's role: ${summary}`
  );

  if (slide.layout !== layout) {
    throw new Error(`Model returned layout "${slide.layout}", expected "${layout}".`);
  }
  return slide;
}
