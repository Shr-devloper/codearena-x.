/**
 * Normalize program output for exact comparison (Judge0 stdout).
 */
export function normalizeOutput(s) {
  if (s == null || s === undefined) return "";
  return String(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function outputsEqual(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
