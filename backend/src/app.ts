import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { authRoutes } from "./modules/auth/index.js";
import { vehiclesRoutes } from "./modules/vehicles/index.js";
import { trackingRoutes } from "./modules/tracking/index.js";

async function main() {
  const app = Fastify({
    logger: {
      transport: { target: "pino-pretty" },
    },
  });

  // Plugins
  const corsOrigin =
    process.env.CORS_ORIGIN === "all"
      ? true
      : process.env.FRONTEND_URL ?? "http://localhost:3000";

  await app.register(fastifyCors, {
    origin: corsOrigin,
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "change-me-in-production-please",
  });

  await app.register(fastifyWebsocket);

  // Auth decorator
  app.decorate(
    "authenticate",
    async function (req: FastifyRequest, reply: FastifyReply) {
      try {
        await req.jwtVerify();
      } catch {
        reply.status(401).send({ error: "Unauthorized" });
      }
    }
  );

  // Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(vehiclesRoutes, { prefix: "/api/vehicles" });
  await app.register(trackingRoutes, { prefix: "/api/tracking" });

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  const PORT = Number(process.env.PORT ?? 4000);
  const HOST = process.env.HOST ?? "localhost";

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\u{1F680} Backend running on http://${HOST}:${PORT}`);
    console.log(`📱 Network: http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
