import { zodToJsonSchema } from "zod-to-json-schema";
import { BENTO_ARCHETYPES, BENTO_ARCHETYPE_SCHEMAS, type BentoArchetype } from "./bento.js";
import { BentoOutlineSchema } from "./bentoDeck.js";

/**
 * Same pattern as llm-tools.ts: the Zod schema is the only place the rules
 * live, and this exposes it in the shape the Chat Completions API wants.
 * One response_format per archetype rather than one for the union, because
 * structured output requires a top-level `type: "object"` and a discriminated
 * union compiles to a top-level `anyOf`.
 */
function jsonSchemaResponseFormat(name: string, schema: unknown) {
  return {
    type: "json_schema" as const,
    json_schema: { name, schema: schema as Record<string, unknown> },
  };
}

export const bentoOutlineResponseFormat = jsonSchemaResponseFormat(
  "propose_bento_outline",
  zodToJsonSchema(BentoOutlineSchema)
);

export const bentoSlideResponseFormats = Object.fromEntries(
  BENTO_ARCHETYPES.map((archetype) => [
    archetype,
    jsonSchemaResponseFormat(
      `fill_${archetype}`,
      zodToJsonSchema(BENTO_ARCHETYPE_SCHEMAS[archetype])
    ),
  ])
) as Record<BentoArchetype, ReturnType<typeof jsonSchemaResponseFormat>>;
