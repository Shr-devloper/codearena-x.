import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const FALLBACK = [
  { topic: "Arrays", v: 30 },
  { topic: "Graphs", v: 25 },
  { topic: "DP", v: 20 },
  { topic: "Strings", v: 35 },
  { topic: "Math", v: 28 },
  { topic: "Trees", v: 22 },
];

export default function SkillGraph({ topicPerformance = [] }) {
  const data = (topicPerformance.length ? topicPerformance : FALLBACK)
    .slice(0, 6)
    .map((t) => ({
      topic: t.tag || t.topic || "?",
      v: t.solved != null ? Math.min(100, 15 + t.solved * 8) : t.v,
    }));

  if (!data.length) return null;

  return (
    <motion.div
      className="h-64 w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="topic"
            tick={{ fill: "rgba(148, 163, 184, 0.9)", fontSize: 11 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Skill"
            dataKey="v"
            stroke="#a78bfa"
            fill="url(#radarFill)"
            fillOpacity={0.85}
            strokeWidth={2}
            dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
