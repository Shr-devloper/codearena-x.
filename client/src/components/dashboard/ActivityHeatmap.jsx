import { useMemo } from "react";

/** GitHub-style grid: 7 rows × nCols weeks, oldest → newest. */
export default function ActivityHeatmap({ days }) {
  const { cols, matrix, maxC } = useMemo(() => {
    const d = days?.length ? [...days] : [];
    if (!d.length) {
      return { cols: 0, matrix: [], maxC: 0 };
    }
    const maxC = Math.max(1, ...d.map((x) => x.count));
    const n = d.length;
    const nCols = Math.ceil(n / 7);
    const matrix = Array.from({ length: 7 }, () => Array(nCols).fill(0));
    d.forEach((day, i) => {
      const c = Math.floor(i / 7);
      const r = i % 7;
      if (c < nCols) matrix[r][c] = day.count;
    });
    return { cols: nCols, matrix, maxC };
  }, [days]);

  if (!cols) {
    return (
      <div className="flex h-28 items-center justify-center text-sm text-slate-500">
        No activity yet — your constellation forms with every solve.
      </div>
    );
  }

  const intensity = (c) => {
    if (c === 0) return "bg-slate-800/90 ring-1 ring-white/5";
    const t = c / maxC;
    if (t < 0.2) return "bg-violet-900/80 shadow-[0_0_8px_rgba(139,92,246,0.25)]";
    if (t < 0.4) return "bg-violet-600/50 shadow-[0_0_10px_rgba(139,92,246,0.4)]";
    if (t < 0.65) return "bg-fuchsia-500/50 shadow-[0_0_12px_rgba(236,72,153,0.45)]";
    return "bg-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.5)]";
  };

  const rows = 7;
  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 0.55rem))` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const c = matrix[row]?.[col] ?? 0;
          return (
            <div
              key={i}
              title={`${c} submissions`}
              className={`h-2.5 w-2.5 rounded-sm transition ${intensity(c)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
