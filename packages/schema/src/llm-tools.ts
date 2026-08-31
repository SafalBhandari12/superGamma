import { zodToJsonSchema } from "zod-to-json-schema";
import { ARCHETYPES, ARCHETYPE_SCHEMAS, type Archetype } from "./slide.js";
import { OutlineSchema } from "./deck.js";

/**
 * The Zod schemas are the only place the rules live; this file exposes them in
 * the shape the Chat Completions API wants.
 *
 * One response_format per archetype rather than one for the union, because
 * structured output requires a top-level `type: "object"` and a discriminated
 * union compiles to a top-level `anyOf`.
 */

type JsonSchema = Record<string, unknown>;

/**
 * `$refStrategy: "none"` is load-bearing, not a style choice.
 *
 * Several fields share a Zod helper (`micro`, `statValue`), and by default
 * zod-to-json-schema deduplicates those into `{"$ref": "#/properties/label"}`
 * pointers. That is valid JSON Schema, but it measurably breaks generation:
 * given a $ref-laden schema the model frequently echoes the SCHEMA back
 * (`{"type":"object","properties":{…}}`) instead of an instance of it.
 */
const toJsonSchema = (schema: Parameters<typeof zodToJsonSchema>[0]): JsonSchema =>
  zodToJsonSchema(schema, { $refStrategy: "none" }) as JsonSchema;

/**
 * Rewrite a JSON Schema to satisfy OpenAI strict structured outputs, which
 * demands that every object list ALL of its properties in `required` and set
 * `additionalProperties: false`. Fields that were optional in Zod become
 * required-but-nullable, so the model can still decline them by sending null.
 *
 * Strict mode is what actually stops the model returning something other than
 * an instance of the schema — the failure this pipeline hit most often was a
 * verbatim echo of the schema itself, which no amount of prompting fixed.
 * Note it enforces *structure*, not string `maxLength`; the Zod parse plus the
 * repair turn remain the gate for length.
 */
function makeStrict(schema: JsonSchema): JsonSchema {
  if (schema === null || typeof schema !== "object") return schema;

  const out: JsonSchema = { ...schema };

  if (Array.isArray(out.anyOf)) out.anyOf = (out.anyOf as JsonSchema[]).map(makeStrict);
  if (Array.isArray(out.allOf)) out.allOf = (out.allOf as JsonSchema[]).map(makeStrict);
  if (out.items && typeof out.items === "object") out.items = makeStrict(out.items as JsonSchema);

  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    const props = out.properties as Record<string, JsonSchema>;
    const wasRequired = new Set((out.required as string[] | undefined) ?? []);
    const next: Record<string, JsonSchema> = {};

    for (const [key, value] of Object.entries(props)) {
      const child = makeStrict(value);
      // Optional in Zod → nullable in strict mode, so "omit this" stays expressible.
      if (!wasRequired.has(key) && typeof child.type === "string") {
        child.type = [child.type as string, "null"];
      }
      next[key] = child;
    }

    out.properties = next;
    out.required = Object.keys(next);
    out.additionalProperties = false;
  }

  return out;
}

function responseFormat(name: string, zodSchema: Parameters<typeof zodToJsonSchema>[0]) {
  return {
    type: "json_schema" as const,
    json_schema: {
      name,
      strict: true,
      schema: makeStrict(toJsonSchema(zodSchema)),
    },
  };
}

/**
 * Strict mode hands back `null` for anything the model declined; Zod's
 * `.optional()` expects the key to be absent instead. Drop them before parsing.
 */
export function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNulls) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, stripNulls(v)])
    ) as T;
  }
  return value;
}

export const outlineResponseFormat = responseFormat("propose_outline", OutlineSchema);

export const slideResponseFormats = Object.fromEntries(
  ARCHETYPES.map((archetype) => [
    archetype,
    responseFormat(`fill_${archetype}`, ARCHETYPE_SCHEMAS[archetype]),
  ])
) as Record<Archetype, ReturnType<typeof responseFormat>>;
