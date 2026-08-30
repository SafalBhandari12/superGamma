import { zodToJsonSchema } from "zod-to-json-schema";
import { GeneratedOutlineSchema } from "./deck.js";
import { LAYOUT_NAMES, SLIDE_LAYOUT_SCHEMAS, type SlideLayout } from "./slide.js";

/**
 * OpenAI/Azure OpenAI `response_format: json_schema` payloads, derived
 * straight from the Zod schemas. The schema is the only place layout
 * rules are defined — this file just exposes it in the shape the
 * Chat Completions API expects, so the model is physically constrained
 * to the fields we defined. (Not using `strict: true` because several
 * fields are optional and strict mode requires all-required + no
 * additionalProperties — Zod's own .parse() is the real backstop, see
 * the generate-validate-repair loop in apps/api.)
 */

function jsonSchemaResponseFormat(name: string, schema: unknown) {
  return {
    type: "json_schema" as const,
    json_schema: {
      name,
      schema: schema as Record<string, unknown>,
    },
  };
}

export const outlineResponseFormat = jsonSchemaResponseFormat(
  "propose_outline",
  zodToJsonSchema(GeneratedOutlineSchema)
);

/**
 * One response_format per layout, not one for the whole slide union.
 * OpenAI/Azure structured-output validation requires the top-level
 * schema to be `type: "object"`; zod-to-json-schema turns a
 * discriminatedUnion into a top-level `anyOf`, which the API rejects.
 * Since the layout is already chosen by the outline step before a slide
 * is filled in, this is also just the more precise prompt.
 */
export const slideContentResponseFormats = Object.fromEntries(
  LAYOUT_NAMES.map((layout) => [
    layout,
    jsonSchemaResponseFormat(`fill_slide_${layout}`, zodToJsonSchema(SLIDE_LAYOUT_SCHEMAS[layout])),
  ])
) as Record<SlideLayout, ReturnType<typeof jsonSchemaResponseFormat>>;
