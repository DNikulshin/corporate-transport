export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000',
  yandexMapsApiKey: import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '',
  gpsIntervalMs: Number(import.meta.env.VITE_GPS_INTERVAL_MS ?? 4000),
} as const
