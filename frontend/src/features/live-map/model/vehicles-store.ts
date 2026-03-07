import { create } from 'zustand'
import type { VehicleWithPosition, VehiclePosition } from '@/shared/domain/vehicle'

interface VehiclesState {
  vehicles: VehicleWithPosition[]
  lastUpdated: number | null

  setVehicles: (vehicles: VehicleWithPosition[]) => void
  updatePosition: (pos: VehiclePosition) => void
  setVehicleOffline: (vehicleId: string) => void
}

export const useVehiclesStore = create<VehiclesState>((set) => ({
  vehicles: [],
  lastUpdated: null,

  setVehicles: (vehicles) => {
    set({ vehicles, lastUpdated: Date.now() })
  },

  updatePosition: (pos) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === pos.vehicleId ? { ...v, position: pos, isActive: true } : v,
      ),
      lastUpdated: Date.now(),
    }))
  },

  setVehicleOffline: (vehicleId) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, isActive: false } : v,
      ),
    }))
  },
}))
