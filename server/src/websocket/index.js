/**
 * Socket.IO — contest rooms & leaderboards (expand in live contest module).
 */
export function attachSocketIO(io) {
  io.on("connection", (socket) => {
    socket.emit("hello", { ok: true });
    socket.on("ping", () => socket.emit("pong"));
  });
}
