import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { getRedis, REDIS_KEYS } from '../../services/redis.js'

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
          id: v.id,
          name: v.name,
          plateNumber: v.plateNumber,
          isActive: v.isActive,
          driverId: v.driver?.id,
          driverName: v.driver?.fullName,
          position,
        }
      }),
    )

    return reply.send(result)
  })
}
