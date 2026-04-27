import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";
import { assertRemoteMongoOnly, withDatabaseName } from "./mongoUri.js";

const SRV_FAIL_CODES = new Set([
  "ECONNREFUSED",
  "ESERVFAIL",
  "ETIMEOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

function isSrvOrDnsConnectionFailure(err) {
  if (!err) return false;
  const code = err.code;
  if (code && SRV_FAIL_CODES.has(code) && err.syscall === "querySrv") {
    return true;
  }
  if (err.message && /querySrv|_mongodb\._tcp|SRV record/i.test(String(err.message))) {
    return true;
  }
  return false;
}

/**
 * SRV resolution uses Node's DNS. Many Windows dev setups have a local stub
 * that returns ECONNREFUSED for SRV; public resolvers usually work.
 */
function usePublicDnsForSrvIfEnabled() {
  if (!env.MONGODB_USE_PUBLIC_DNS) return;
  if (!String(resolvedPrimaryUriForConnect()).startsWith("mongodb+srv://")) return;
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const connectOptions = {
  serverSelectionTimeoutMS: 20_000,
  maxPoolSize: 10,
  retryWrites: true,
  family: 4,
};

let connectionHandlersBound = false;
let expectedDisconnect = false;

function bindConnectionHandlers() {
  if (connectionHandlersBound) return;
  connectionHandlersBound = true;
  mongoose.connection.on("error", (err) => {
    console.error("[CodeArena X] MongoDB connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    if (expectedDisconnect) return;
    console.warn("[CodeArena X] MongoDB client disconnected from Atlas (unexpected)");
  });
}

/**
 * @returns {string}
 */
function resolvedPrimaryUriForConnect() {
  return withDatabaseName(env.MONGODB_URI, env.MONGODB_DB_NAME);
}

/**
 * @returns {string|undefined}
 */
function resolvedDirectUriForConnect() {
  if (!env.MONGODB_DIRECT_URI) return undefined;
  return withDatabaseName(env.MONGODB_DIRECT_URI, env.MONGODB_DB_NAME);
}

function printMongoSrvHelp() {
  console.error(`
[CodeArena X] MongoDB SRV (DNS) resolution failed. Options:
  • MONGODB_USE_PUBLIC_DNS is ${env.MONGODB_USE_PUBLIC_DNS} (set "true" to use 8.8.8.8/1.1.1.1; default: true).
  • In Atlas: Network Access → add your current IP (0.0.0.0/0 for dev only).
  • In Atlas: Connect → Drivers → copy the "standard" connection string (starts with mongodb://),
    put it in MONGODB_DIRECT_URI in .env to bypass SRV.
`);
}

/**
 * @returns {Promise<typeof import("mongoose").Connection>}
 */
export async function connectDb() {
  bindConnectionHandlers();
  mongoose.set("strictQuery", true);

  assertRemoteMongoOnly(env.MONGODB_URI);
  if (env.MONGODB_DIRECT_URI) {
    assertRemoteMongoOnly(env.MONGODB_DIRECT_URI);
  }

  const primary = resolvedPrimaryUriForConnect();
  usePublicDnsForSrvIfEnabled();

  try {
    await mongoose.connect(primary, connectOptions);
  } catch (firstErr) {
    const canTryDirect =
      resolvedDirectUriForConnect() &&
      isSrvOrDnsConnectionFailure(firstErr) &&
      String(env.MONGODB_URI).startsWith("mongodb+srv://");

    if (!canTryDirect) {
      if (isSrvOrDnsConnectionFailure(firstErr) && !env.MONGODB_DIRECT_URI) {
        printMongoSrvHelp();
      }
      console.error("[CodeArena X] Failed to connect to MongoDB Atlas");
      throw firstErr;
    }

    console.warn(
      "[CodeArena X] MONGODB_URI (SRV) failed; trying MONGODB_DIRECT_URI (standard seed list)…"
    );
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    try {
      const direct = resolvedDirectUriForConnect();
      await mongoose.connect(direct, connectOptions);
    } catch (secondErr) {
      printMongoSrvHelp();
      console.error("[CodeArena X] Failed to connect to MongoDB Atlas (direct URI)");
      throw secondErr;
    }
    console.info(
      "[CodeArena X] Using MONGODB_DIRECT_URI. Consider fixing SRV/DNS; you may keep this fallback in .env."
    );
  }

  const db = mongoose.connection;
  const name = db.name || env.MONGODB_DB_NAME;
  console.log(
    `MongoDB Atlas connected — database "${name}" (problems, users, submissions, mockinterviewsessions; progress = derived from submissions)`
  );
  return db;
}

export async function disconnectDb() {
  if (mongoose.connection.readyState === 0) return;
  expectedDisconnect = true;
  try {
    await mongoose.disconnect();
  } finally {
    expectedDisconnect = false;
  }
  console.log("[CodeArena X] MongoDB connection closed");
}
