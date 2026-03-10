import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { getRedis, REDIS_CHANNELS, REDIS_KEYS } from '../../services/redis.js'

const prisma = new PrismaClient()

export async function vehiclesRoutes(app: FastifyInstance) {
  // GET /api/vehicles — список всех машин с последней позицией из Redis
  app.get('/', { onRequest: [app.authenticate] }, async (_req, reply) => {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: {
          select: { id: true, fullName: true },
        },
      },
    })

    const redis = await getRedis()

    const result = await Promise.all(
      vehicles.map(async (v) => {
        const posJson = await redis.get(REDIS_KEYS.vehiclePosition(v.id))
        const position = posJson ? (JSON.parse(posJson) as object) : undefined

        return {
          ...v,
          driverName: v.driver?.fullName,
          position,
        }
      }),
    )

    return reply.send(result)
  })

  // POST /api/vehicles/:id/online — начать смену
  app.post('/:id/online', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await prisma.vehicle.update({ where: { id }, data: { online: true } })

    const redis = await getRedis()
    await redis.publish(
      REDIS_CHANNELS.vehicleOnline,
      JSON.stringify({ type: 'vehicle_online', vehicleId: id }),
    )

    return reply.send({ ok: true })
  })

  // POST /api/vehicles/:id/offline — завершить смену
  app.post('/:id/offline', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await prisma.vehicle.update({ where: { id }, data: { online: false } })

    const redis = await getRedis()
    await redis.publish(
      REDIS_CHANNELS.vehicleOffline,
      JSON.stringify({ type: 'vehicle_offline', vehicleId: id }),
    )

    return reply.send({ ok: true })
  })
}
