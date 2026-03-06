import { createClient } from 'redis'

let _client: ReturnType<typeof createClient> | null = null
let _subscriber: ReturnType<typeof createClient> | null = null

export async function getRedis() {
  if (_client) return _client
  _client = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
  await _client.connect()
  return _client
}

export async function getRedisSubscriber() {
  if (_subscriber) return _subscriber
  _subscriber = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
  await _subscriber.connect()
  return _subscriber
}

export const REDIS_KEYS = {
  vehiclePosition: (id: string) => `vehicle:pos:${id}`,
  activeVehicles: () => 'vehicles:active',
}

export const REDIS_CHANNELS = {
  positionUpdate: 'tracking:position',
  vehicleOffline: 'tracking:offline',
}
