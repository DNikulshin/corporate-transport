export interface VehiclePosition {
  vehicleId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  isActive: boolean;
  driverId?: string;
  driverName?: string;
  position?: VehiclePosition;
}
