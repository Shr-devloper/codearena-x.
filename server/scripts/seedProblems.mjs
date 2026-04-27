/**
 * Idempotent seed from data/*.seed.json into MongoDB Atlas (database: codearena_x).
 * Run: cd server && npm run seed:problems
 *
 * Optional: SEED_CLEAR_PROBLEMS=true  →  delete all documents in `problems` before upserting.
 */
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { Problem } from "../src/models/Problem.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, "..");
const dataPath = path.join(serverDir, "data", "problems.seed.json");
const extraPath = path.join(serverDir, "data", "chambers-extra.seed.json");
const batch1Path = path.join(serverDir, "data", "problems-batch1.seed.json");
const batch2Path = path.join(serverDir, "data", "problems-batch2.seed.json");

const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const extra = fs.existsSync(extraPath)
  ? JSON.parse(fs.readFileSync(extraPath, "utf-8"))
  : { problems: [] };
const batch1 = fs.existsSync(batch1Path)
  ? JSON.parse(fs.readFileSync(batch1Path, "utf-8"))
  : { problems: [] };
const batch2 = fs.existsSync(batch2Path)
  ? JSON.parse(fs.readFileSync(batch2Path, "utf-8"))
  : { problems: [] };
const allProblems = [
  ...raw.problems,
  ...extra.problems,
  ...batch1.problems,
  ...batch2.problems,
];
const seen = new Set();
for (const p of allProblems) {
  if (seen.has(p.slug)) {
    console.error(`Duplicate slug in seed data: ${p.slug}`);
    process.exit(1);
  }
  seen.add(p.slug);
}

const se = String(process.env.SEED_CLEAR_PROBLEMS || "")
  .trim()
  .toLowerCase();
const clearFirst = se === "1" || se === "true" || se === "yes";

async function main() {
  await connectDb();
  console.log("Connected to Atlas");

  if (clearFirst) {
    const { deletedCount } = await Problem.deleteMany({});
    console.log(`Cleared ${deletedCount} existing problems (SEED_CLEAR_PROBLEMS)`);
  }

  let n = 0;
  for (const p of allProblems) {
    const testCases = [
      ...p.sampleTestCases.map((tc) => ({ ...tc, isHidden: false })),
      ...p.hiddenTestCases.map((tc) => ({ ...tc, isHidden: true })),
    ];
    await Problem.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          title: p.title,
          slug: p.slug,
          description: p.description,
          difficulty: p.difficulty,
          tags: p.tags,
          inputFormat: p.inputFormat,
          outputFormat: p.outputFormat,
          constraints: p.constraints,
          hints: p.hints,
          starterCode: p.starterCode,
          testCases,
          isPublished: true,
        },
      },
      { upsert: true, new: true }
    );
    n++;
  }
  const totalInDb = await Problem.countDocuments();
  console.log(`Inserted ${n} problems (upserted from seed files, db=${env.MONGODB_DB_NAME})`);
  console.log(`Total problem documents in Atlas: ${totalInDb}`);

  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
