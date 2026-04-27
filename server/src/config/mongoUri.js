import { ConnectionString } from "mongodb-connection-string-url";

/**
 * @param {string} uri
 * @param {string} dbName
 * @returns {string}
 */
export function withDatabaseName(uri, dbName) {
  if (!dbName || !uri) return uri;
  const c = new ConnectionString(uri);
  c.pathname = `/${String(dbName).replace(/^\/+/, "")}`;
  return c.toString();
}

function isLocalHostSeed(seed) {
  const s = String(seed);
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end > 0) {
      const inner = s.slice(1, end);
      if (inner === "::1" || inner === "0:0:0:0:0:0:0:1") return true;
    }
  }
  const host = s.split(":")[0].toLowerCase();
  if (host === "127.0.0.1" || host === "localhost" || host === "::1") return true;
  return false;
}

/**
 * Reject connection strings that target a local mongod. Atlas-only policy.
 * @param {string} uri
 */
export function assertRemoteMongoOnly(uri) {
  const c = new ConnectionString(uri);
  for (const seed of c.hosts) {
    if (isLocalHostSeed(seed)) {
      throw new Error(
        "[CodeArena X] Local MongoDB is not supported. Set MONGODB_URI to a MongoDB Atlas SRV (or MONGODB_DIRECT_URI) string."
      );
    }
  }
}
