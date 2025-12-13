// ADR: ADR-011-web-api-architecture

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

import { appRouter } from "./src/server/routers";
import { createContext } from "./src/server/context";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number.parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ server, path: "/api/trpc" });
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  const shutdown = () => {
    handler.broadcastReconnectNotification();
    wss.close();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
