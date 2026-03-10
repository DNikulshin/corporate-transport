import { httpClient } from '@/shared/api/http-client'

export const setVehicleOnline = async (vehicleId: string) => {
  return httpClient.post(`/vehicles/${vehicleId}/online`)
}

export const setVehicleOffline = async (vehicleId: string) => {
  return httpClient.post(`/vehicles/${vehicleId}/offline`)
}
