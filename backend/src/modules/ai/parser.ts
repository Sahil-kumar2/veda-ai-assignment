import { logger } from "../../utils/logger";
import { ApiError } from "../../utils/ApiError";
import { assignmentOutputSchema, AssignmentOutput } from "./schema";

const tryJsonParse = (str: string): unknown | null => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const sanitizeJsonLike = (raw: string): string =>
  raw
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

const extractByBrackets = (raw: string): unknown | null => {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null;
  }

  return tryJsonParse(raw.slice(firstBrace, lastBrace + 1));
};

const extractFromMarkdownFence = (raw: string): unknown | null => {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = fenceRegex.exec(raw);
  if (!match || !match[1]) return null;
  return tryJsonParse(match[1].trim());
};

export const parseLLMResponse = (raw: string): AssignmentOutput => {
  let parsed: unknown | null = null;

  parsed = tryJsonParse(raw);
  if (parsed !== null) logger.info("[Parser] Layer 1 (direct parse) succeeded");

  if (parsed === null) {
    parsed = extractByBrackets(raw);
    if (parsed !== null) logger.info("[Parser] Layer 2 (bracket extraction) succeeded");
  }

  if (parsed === null) {
    parsed = extractFromMarkdownFence(raw);
    if (parsed !== null) logger.info("[Parser] Layer 3 (markdown fence) succeeded");
  }

  if (parsed === null) {
    parsed = tryJsonParse(sanitizeJsonLike(raw));
    if (parsed !== null) logger.info("[Parser] Layer 4 (sanitized parse) succeeded");
  }

  if (parsed === null) {
    logger.error(
      `[Parser] All extraction layers failed. Raw response (first 500 chars):\n${raw.slice(0, 500)}`
    );
    throw new ApiError(
      422,
      "LLM response could not be parsed as JSON after all extraction attempts"
    );
  }

  const validation = assignmentOutputSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(" | ");
    logger.error(`[Parser] Schema validation failed: ${issues}`);
    throw new ApiError(422, `LLM output failed schema validation: ${issues}`);
  }

  logger.info(
    `[Parser] Validation passed - ${validation.data.sections.length} section(s), ` +
      `${validation.data.sections.reduce((acc, s) => acc + s.questions.length, 0)} question(s)`
  );

  return validation.data;
};

