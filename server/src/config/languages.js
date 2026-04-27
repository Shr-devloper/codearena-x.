/**
 * Judge0 language_id mapping (CE).
 * @see https://ce.judge0.com/ or your host’s language list
 */
export const JUDGE0_LANGUAGE_ID = {
  javascript: 63, // Node.js
  python: 71, // Python 3.8+
  cpp: 54, // C++ (GCC 9.2.0)
};

export const MONACO_LANGUAGE = {
  javascript: "javascript",
  python: "python",
  cpp: "cpp",
};

export function getJudge0LanguageId(lang) {
  const id = JUDGE0_LANGUAGE_ID[lang];
  if (id == null) throw new Error(`Unsupported language: ${lang}`);
  return id;
}
