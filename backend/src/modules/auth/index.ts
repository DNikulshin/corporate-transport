import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 дней

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const body = LoginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Неверный формат' })

    const { username, password } = body.data

    const user = await prisma.user.findUnique({
      where: { username },
      include: { vehicle: true },
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: 'Неверный логин или пароль' })
    }

    const accessToken = app.jwt.sign(
      { userId: user.id, role: user.role },
      { expiresIn: '15m' },
    )

    const refreshToken = app.jwt.sign(
      { userId: user.id, type: 'refresh' },
      { expiresIn: '30d' },
    )

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    return reply.send({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role.toLowerCase(),
        vehicleId: user.vehicleId ?? undefined,
      },
      tokens: { accessToken, refreshToken },
    })
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) return reply.status(400).send({ error: 'Нет refresh токена' })

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
      return reply.status(401).send({ error: 'Токен недействителен' })
    }

    const accessToken = app.jwt.sign(
      { userId: stored.userId, role: stored.user.role },
      { expiresIn: '15m' },
    )

    return reply.send({ accessToken })
  })

  // POST /api/auth/logout
  app.post('/logout', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    return reply.send({ ok: true })
  })

  // GET /api/auth/me
  app.get('/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vehicle: true },
    })
    if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })

    return reply.send({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role.toLowerCase(),
      vehicleId: user.vehicleId ?? undefined,
    })
  })
}
