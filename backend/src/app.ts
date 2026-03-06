import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/index.js'
import { vehiclesRoutes } from './modules/vehicles/index.js'
import { trackingRoutes } from './modules/tracking/index.js'

async function main() {
  const app = Fastify({
    logger: {
      transport: { target: 'pino-pretty' },
    },
  })

  // Plugins
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL ?? 'https://3000-firebase-corporate-transport-1772806466665.cluster-jgdkb37mtnfb4urxtja5guzqog.cloudworkstations.dev',
    credentials: true,
  })

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production-please',
  })

  await app.register(fastifyWebsocket)

  // Auth decorator
  app.decorate(
    'authenticate',
    async function (req: FastifyRequest, reply: FastifyReply) {
      try {
        await req.jwtVerify()
      } catch {
        reply.status(401).send({ error: 'Unauthorized' })
      }
    },
  )

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(vehiclesRoutes, { prefix: '/api/vehicles' })
  await app.register(trackingRoutes, { prefix: '/api/tracking' })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  const PORT = Number(process.env.PORT ?? 4000)

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`\u{1F680} Backend running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
