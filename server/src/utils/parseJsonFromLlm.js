/**
 * Extract JSON object from model output (raw JSON or fenced ```json blocks).
 */
export function parseJsonFromLlm(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty model output");
  }
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  const payload = fence ? fence[1].trim() : trimmed;
  return JSON.parse(payload);
}
