import { Submission } from "../models/Submission.js";
import { getPlanUsageState } from "./plan.service.js";

function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return startOfUtcDay(d);
}

/**
 * Activity heatmap for last `days` days (counts any submission per day).
 */
export async function buildHeatmap(userId, days = 53 * 7) {
  const since = daysAgo(days);
  const rows = await Submission.aggregate([
    { $match: { user: userId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = daysAgo(i);
    const key = day.toISOString().slice(0, 10);
    out.push({ date: key, count: map[key] || 0 });
  }
  return out;
}

export async function topicPerformance(userId) {
  const stats = await Submission.aggregate([
    { $match: { user: userId, status: "AC" } },
    { $lookup: { from: "problems", localField: "problem", foreignField: "_id", as: "p" } },
    { $unwind: "$p" },
    { $unwind: "$p.tags" },
    { $group: { _id: "$p.tags", solved: { $sum: 1 } } },
    { $sort: { solved: -1 } },
  ]);
  return stats.map((s) => ({ tag: s._id, solved: s.solved }));
}

export async function getDashboardSummary(userId) {
  const [totalSubs, accepted, lastSub] = await Promise.all([
    Submission.countDocuments({ user: userId }),
    Submission.countDocuments({ user: userId, status: "AC" }),
    Submission.findOne({ user: userId }).sort({ createdAt: -1 }),
  ]);

  const heatmap = await buildHeatmap(userId, 7 * 12);
  const topics = await topicPerformance(userId);

  const recent = await Submission.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("problem", "title difficulty tags")
    .lean();

  const accuracy = totalSubs > 0 ? Math.round((accepted / totalSubs) * 100) : 0;

  const streak = await computeStreak(userId);

  const hireability = computeHireability({
    accepted,
    totalSubs,
    streak,
    topicCount: topics.length,
  });

  const skillDna = {
    accuracy,
    speedScore: lastSub?.runtimeMs ? Math.max(0, 100 - Math.min(100, lastSub.runtimeMs / 50)) : 50,
    topicPerformance: topics.slice(0, 8),
    confidence: Math.min(100, Math.round(accuracy * 0.6 + streak * 5)),
  };

  const planUsage = await getPlanUsageState(userId);

  return {
    planUsage,
    stats: {
      totalSubmissions: totalSubs,
      accepted,
      accuracy,
      streak,
      hireability,
    },
    heatmap,
    skillDna,
    recentSubmissions: recent,
    weaknessInput: {
      recentSubmissionsSummary: recent.map((s) => ({
        title: s.problem?.title,
        status: s.status,
        difficulty: s.problem?.difficulty,
      })),
      topicStats: topics,
    },
  };
}

async function computeStreak(userId) {
  const subs = await Submission.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(500)
    .select("createdAt")
    .lean();

  const daySet = new Set();
  for (const s of subs) {
    const key = startOfUtcDay(s.createdAt).toISOString().slice(0, 10);
    daySet.add(key);
  }

  let streak = 0;
  let d = startOfUtcDay(new Date());
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function computeHireability({ accepted, totalSubs, streak, topicCount }) {
  const consistency = Math.min(100, streak * 8 + topicCount * 3);
  const quality = totalSubs > 0 ? (accepted / totalSubs) * 100 : 0;
  const volume = Math.min(100, accepted * 2);
  const raw = quality * 0.45 + volume * 0.25 + consistency * 0.3;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  let tier = "Startup-ready";
  if (score >= 85) tier = "FAANG-ready";
  else if (score >= 65) tier = "MNC-ready";

  return { score, tier, breakdown: { quality, volume, consistency } };
}
