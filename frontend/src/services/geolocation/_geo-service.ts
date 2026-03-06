export interface GeoPosition {
  lat: number
  lng: number
  heading: number | null
  speed: number | null       // м/с
  accuracy: number
  timestamp: number
}

export type GeoWatcher = (pos: GeoPosition) => void
export type GeoErrorHandler = (err: GeolocationPositionError) => void

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
}

export class GeoService {
  private watchId: number | null = null

  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  watch(onPosition: GeoWatcher, onError?: GeoErrorHandler): void {
    if (!this.isSupported()) {
      onError?.({
        code: 2,
        message: 'Геолокация не поддерживается',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        })
      },
      onError,
      GEO_OPTIONS,
    )
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  async getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }),
        reject,
        GEO_OPTIONS,
      )
    })
  }
}

export const geoService = new GeoService()
