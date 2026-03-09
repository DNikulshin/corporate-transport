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

  // Настройка CORS для работы и в облаке, и локально
  const allowedOrigins = [
    "http://localhost:3000",
    // Разрешает любой поддомен cloudworkstations.dev (для Firebase Studio)
    /\.cloudworkstations\.dev$/, 
    // Разрешает любой поддомен localtunnel.me (для телефона)
    /\.localtunnel\.me$/         
  ];

  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN === "all" ? true : allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Plugins
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

  // В Cloud Workstations важно слушать 0.0.0.0 вместо localhost
  const PORT = Number(process.env.PORT ?? 4000);
  const HOST = "0.0.0.0"; 

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\u{1F680} Backend is accessible externally via Cloud Workstations URL`);
    console.log(`📡 Listening on: http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
