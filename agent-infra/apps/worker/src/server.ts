import { createServer as createHttpServer } from "node:http";
import { collectMetrics } from "./metrics.js";
import { logger } from "./lib/logger.js";
import { startWorker, stopWorker } from "./worker.js";

const port = Number(process.env.WORKER_PORT ?? 4100);

async function main() {
  const worker = await startWorker();

  const server = createHttpServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/metrics") {
      const metrics = await collectMetrics();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(metrics);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    logger.info({ port }, "Worker metrics server listening");
  });

  const shutdown = async () => {
    logger.info("Shutting down worker");
    await stopWorker(worker);
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.env.NODE_ENV !== "test") {
  main().catch(error => {
    logger.error({ error }, "Worker startup failed");
    process.exit(1);
  });
}
