import { openDB, type IDBPDatabase } from 'idb'
import type { QueuedPosition } from '@/shared/domain/vehicle'

const DB_NAME = 'ct-offline-queue'
const STORE_NAME = 'gps-queue'

let _db: IDBPDatabase | null = null

async function getDb() {
  if (_db) return _db
  _db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'timestamp',
          autoIncrement: false,
        })
        store.createIndex('synced', 'synced')
      }
    },
  })
  return _db
}

export const offlineQueue = {
  async enqueue(pos: Omit<QueuedPosition, 'synced'>): Promise<void> {
    const db = await getDb()
    await db.put(STORE_NAME, { ...pos, synced: false })
  },

  async getPending(): Promise<QueuedPosition[]> {
    const db = await getDb()
    const all = (await db.getAll(STORE_NAME)) as QueuedPosition[]
    return all.filter((item) => !item.synced)
  },

  async markSynced(timestamps: number[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await Promise.all(
      timestamps.map(async (ts) => {
        const item = await tx.store.get(ts)
        if (item) await tx.store.put({ ...item, synced: true })
      }),
    )
    await tx.done
  },

  async clearSynced(): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const all = (await tx.store.getAll()) as QueuedPosition[]
    const toDelete = all.filter((item) => item.synced).map((item) => item.timestamp)
    await Promise.all(toDelete.map((ts) => tx.store.delete(ts)))
    await tx.done
  },

  async count(): Promise<number> {
    const db = await getDb()
    const all = (await db.getAll(STORE_NAME)) as QueuedPosition[]
    return all.filter((item) => !item.synced).length
  },
}
