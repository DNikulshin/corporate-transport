import { create } from 'zustand'
import type { VehicleWithPosition, VehiclePosition } from '@/shared/domain/vehicle'

interface VehiclesState {
  vehicles: Map<string, VehicleWithPosition>
  lastUpdated: number | null

  setVehicles: (vehicles: VehicleWithPosition[]) => void
  updatePosition: (pos: VehiclePosition) => void
  setVehicleOffline: (vehicleId: string) => void
  getAll: () => VehicleWithPosition[]
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: new Map(),
  lastUpdated: null,

  setVehicles: (vehicles) => {
    const map = new Map(vehicles.map((v) => [v.id, v]))
    set({ vehicles: map, lastUpdated: Date.now() })
  },

  updatePosition: (pos) => {
    set((state) => {
      const vehicles = new Map(state.vehicles)
      const existing = vehicles.get(pos.vehicleId)
      if (existing) {
        vehicles.set(pos.vehicleId, { ...existing, position: pos, isActive: true })
      }
      return { vehicles, lastUpdated: Date.now() }
    })
  },

  setVehicleOffline: (vehicleId) => {
    set((state) => {
      const vehicles = new Map(state.vehicles)
      const existing = vehicles.get(vehicleId)
      if (existing) {
        vehicles.set(vehicleId, { ...existing, isActive: false })
      }
      return { vehicles }
    })
  },

  getAll: () => Array.from(get().vehicles.values()),
}))
