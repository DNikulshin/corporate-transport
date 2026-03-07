import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import {
  getRedis,
  getRedisSubscriber,
  REDIS_KEYS,
  REDIS_CHANNELS,
} from '../../services/redis.js'

const prisma = new PrismaClient()

interface PositionPayload {
  vehicleId: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp: number
}

export async function trackingRoutes(app: FastifyInstance) {
  // WebSocket — водитель шлёт позиции
  app.get('/ws', { websocket: true }, async (socket, req) => {
    // Верификация токена из query
    const token = (req.query as Record<string, string>).token
    if (!token) { socket.close(1008, 'No token'); return }

    let userId: string
    let vehicleId: string
    try {
      const decoded = app.jwt.verify(token) as { userId: string; role: string }
      userId = decoded.userId
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user?.vehicleId) { socket.close(1008, 'No vehicle'); return }
      vehicleId = user.vehicleId
    } catch {
      socket.close(1008, 'Invalid token')
      return
    }

    // Пометить машину активной
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { isActive: true } })

    const redis = await getRedis()

    socket.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; data?: PositionPayload }
        if (msg.type === 'ping') { socket.send(JSON.stringify({ type: 'pong' })); return }
        if (msg.type !== 'position' || !msg.data) return

        const pos = msg.data

        // Сохранить последнюю позицию в Redis (TTL 10 мин)
        await redis.set(
          REDIS_KEYS.vehiclePosition(vehicleId),
          JSON.stringify({ ...pos, vehicleId }),
          { EX: 600 },
        )

        // Записать в БД для истории
        await prisma.positionLog.create({
          data: {
            vehicleId,
            lat: pos.lat,
            lng: pos.lng,
            heading: pos.heading,
            speed: pos.speed,
            accuracy: pos.accuracy,
          },
        })

        // Publish в Redis → все SSE-клиенты получат обновление
        await redis.publish(
          REDIS_CHANNELS.positionUpdate,
          JSON.stringify({ type: 'position', data: { ...pos, vehicleId } }),
        )
      } catch {
        // ignore malformed
      }
    })

    socket.on('close', async () => {
      // Пометить машину неактивной
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { isActive: false } })
      const redis2 = await getRedis()
      await redis2.publish(
        REDIS_CHANNELS.vehicleOffline,
        JSON.stringify({ type: 'vehicle_offline', vehicleId }),
      )
    })
  })

  // SSE — клиенты подписываются на поток позиций
  app.get('/stream', async (req, reply) => {
    const token = (req.query as Record<string, string>).token
    if (!token) return reply.status(401).send({ error: 'No token' })

    try {
      app.jwt.verify(token)
    } catch {
      return reply.status(401).send({ error: 'Invalid token' })
    }

    const corsOrigin =
      process.env.CORS_ORIGIN === 'all'
        ? '*'
        : process.env.FRONTEND_URL ?? 'http://localhost:3000'

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Credentials': 'true',
    })

    const send = (data: object) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Keepalive каждые 20 сек
    const keepalive = setInterval(() => {
      reply.raw.write(': keepalive\n\n')
    }, 20_000)

    // Подписаться на Redis pub/sub
    const sub = await getRedisSubscriber()

    const handler = (message: string) => {
      try {
        const parsed = JSON.parse(message) as object
        send(parsed)
      } catch { /* ignore */ }
    }

    await sub.subscribe(REDIS_CHANNELS.positionUpdate, handler)
    await sub.subscribe(REDIS_CHANNELS.vehicleOffline, handler)

    req.raw.on('close', async () => {
      clearInterval(keepalive)
      await sub.unsubscribe(REDIS_CHANNELS.positionUpdate, handler)
      await sub.unsubscribe(REDIS_CHANNELS.vehicleOffline, handler)
    })
  })
}
