// ADR: ADR-011-web-api-architecture

import { createServer } from "http";
import { createServer as createNetServer } from "net";
import { parse } from "url";
import next from "next";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

import { appRouter } from "./src/server/routers";
import { createContext } from "./src/server/context";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const basePort = Number.parseInt(process.env.PORT || "3000", 10);
const MAX_PORT_RETRIES = 10;

function checkPortAvailable(portToCheck: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = createNetServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(portToCheck);
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    const portToTry = startPort + attempt;
    if (await checkPortAvailable(portToTry)) {
      return portToTry;
    }
    console.log(`⚠ Port ${portToTry} is in use, trying ${portToTry + 1}...`);
  }
  throw new Error(
    `Could not find an available port after ${MAX_PORT_RETRIES} attempts (tried ${startPort}-${startPort + MAX_PORT_RETRIES - 1})`
  );
}

async function startServer() {
  const port = await findAvailablePort(basePort);
  if (port !== basePort) {
    console.log(`✓ Using port ${port} instead of ${basePort}`);
  }

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

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${port} became unavailable during startup.`);
      console.error("Please try again or specify a different port with PORT=XXXX\n");
      process.exit(1);
    }
    throw error;
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
