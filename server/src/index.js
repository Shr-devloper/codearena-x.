import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import "./models/index.js";
import { connectDb } from "./config/db.js";
import { env, isCorsOriginAllowed } from "./config/env.js";
import { configurePassport } from "./config/passport.js";
import { attachSocketIO } from "./websocket/index.js";

configurePassport();

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isCorsOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});
attachSocketIO(io);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n[CodeArena X] Port ${env.PORT} is already in use.\n` +
        `  • Stop the other Node process, or\n` +
        `  • Set PORT=5001 (or another free port) in your .env file.\n` +
        `  Windows: netstat -ano | findstr ":${env.PORT}"  →  taskkill /PID <pid> /F\n`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

async function main() {
  await connectDb();
  server.listen(env.PORT, () => {
    console.log(`CodeArena X API listening on http://localhost:${env.PORT}`);
    console.log(`Health: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
