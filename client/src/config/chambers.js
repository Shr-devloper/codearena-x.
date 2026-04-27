import {
  Layers,
  Type,
  GitBranch,
  Boxes,
  Network,
  Share2,
  ArrowDownWideNarrow,
  ListOrdered,
  Sparkles,
  Workflow,
  Search,
  Zap,
} from "lucide-react";

/** Mirrors server chamber ids + UI icon mapping (tag strings live on each problem). */
export const CHAMBER_UI = [
  { id: "arrays", icon: Layers },
  { id: "strings", icon: Type },
  { id: "recursion", icon: GitBranch },
  { id: "dynamic-programming", icon: Boxes },
  { id: "graphs", icon: Network },
  { id: "trees", icon: Share2 },
  { id: "sorting", icon: ArrowDownWideNarrow },
  { id: "stack-queue", icon: ListOrdered },
  { id: "greedy", icon: Sparkles },
  { id: "recursion-backtracking", icon: Workflow },
  { id: "sorting-searching", icon: Search },
  { id: "mixed-advanced", icon: Zap },
];

export function iconForChamber(chamberId) {
  const row = CHAMBER_UI.find((c) => c.id === chamberId);
  return row?.icon ?? Layers;
}
