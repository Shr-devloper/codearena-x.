/** Mirrors server Judge0 mapping for UI (monaco + API language id string). */
export const LANGUAGES = [
  { id: "javascript", label: "JavaScript (Node.js)", monaco: "javascript" },
  { id: "python", label: "Python 3", monaco: "python" },
  { id: "cpp", label: "C++ (GCC)", monaco: "cpp" },
];

export function getMonacoLanguage(langId) {
  return LANGUAGES.find((l) => l.id === langId)?.monaco || "javascript";
}
