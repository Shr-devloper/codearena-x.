import { runJudge0Case, verdictForTestCase } from "./judge0.service.js";

/**
 * Run code against an ordered list of { input, expectedOutput }.
 * Stops on first non-AC and returns aggregate timings (max) across **accepted** cases so far.
 */
export async function runAllTests(code, language, cases) {
  const results = [];
  let maxTime = 0;
  let maxMem = 0;
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const parsed = await runJudge0Case({
      code,
      language,
      stdin: tc.input,
    });
    const v = verdictForTestCase(parsed, tc.expectedOutput);
    const row = {
      index: i,
      verdict: v.verdict,
      runtimeMs: v.runtimeMs ?? parsed.timeMs,
      memoryKb: v.memoryKb ?? parsed.memoryKb,
      error: v.error,
      ...(v.stdout != null && String(v.stdout).length > 0
        ? { actualOutput: v.stdout }
        : {}),
    };
    if (v.runtimeMs != null) maxTime = Math.max(maxTime, v.runtimeMs);
    if (v.memoryKb != null) maxMem = Math.max(maxMem, v.memoryKb);
    results.push(row);
    if (v.verdict !== "AC") {
      return {
        status: v.verdict,
        results,
        runtimeMs: maxTime,
        memoryKb: maxMem,
        failedIndex: i,
      };
    }
  }
  return { status: "AC", results, runtimeMs: maxTime, memoryKb: maxMem };
}
