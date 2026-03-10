import { createClient } from 'redis'

// Per node-redis documentation, it's recommended to use a duplicated client
// for subscriber mode to prevent it from interfering with the client used for commands.

type RedisClient = ReturnType<typeof createClient>

let _client: RedisClient | null = null
let _subscriber: RedisClient | null = null

/**
 * Returns a Redis client for general commands (GET, SET, PUBLISH, etc.)
 */
export async function getRedis(): Promise<RedisClient> {
  if (_client) return _client

  _client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  })

  _client.on('error', (err) => console.error('Redis Client Error', err))

  await _client.connect()
  return _client
}

/**
 * Returns a dedicated Redis client for subscribing to channels (SUBSCRIBE).
 */
export async function getRedisSubscriber(): Promise<RedisClient> {
  if (_subscriber) return _subscriber

  // Ensure the main client is available
  const client = await getRedis()

  // Duplicate the main client for pub/sub
  _subscriber = client.duplicate()

  _subscriber.on('error', (err) => console.error('Redis Subscriber Error', err))

  await _subscriber.connect()
  return _subscriber
}

export const REDIS_KEYS = {
  vehiclePosition: (id: string) => `vehicle:pos:${id}`,
  activeVehicles: () => 'vehicles:active',
}

export const REDIS_CHANNELS = {
  positionUpdate: 'tracking:position',
  vehicleOnline: 'tracking:online',
  vehicleOffline: 'tracking:offline',
}
