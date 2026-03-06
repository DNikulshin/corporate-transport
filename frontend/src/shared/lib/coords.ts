export interface LatLng {
  lat: number
  lng: number
}

/**
 * Линейная интерполяция между двумя координатами
 * используется для плавного движения маркера на карте
 */
export function lerpLatLng(from: LatLng, to: LatLng, t: number): LatLng {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  }
}

/**
 * Расстояние между двумя точками в метрах (формула Haversine)
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Вычислить курс (heading) от точки a к точке b в градусах (0=север)
 */
export function bearing(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
