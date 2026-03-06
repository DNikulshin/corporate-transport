export interface VehiclePosition {
  vehicleId: string
  lat: number
  lng: number
  heading?: number   // направление 0-360
  speed?: number     // км/ч
  accuracy?: number  // метры
  timestamp: number  // unix ms
}

export interface Vehicle {
  id: string
  name: string           // напр. "Газель 001"
  plateNumber: string    // гос. номер
  driverId?: string
  driverName?: string
  isActive: boolean      // в эфире сейчас
}

export interface VehicleWithPosition extends Vehicle {
  position?: VehiclePosition
}

// Очередь оффлайн-координат для IndexedDB
export interface QueuedPosition extends VehiclePosition {
  synced: boolean
}
