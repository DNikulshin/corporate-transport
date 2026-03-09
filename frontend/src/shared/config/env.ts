export const env = {
  // Используем относительный путь. Vite proxy перехватит этот запрос.
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',

  // Этот URL будет генерироваться динамически в ws-клиенте.
  // Оставляем пустым, чтобы избежать путаницы.
  wsUrl: import.meta.env.VITE_WS_URL ?? '',

  yandexMapsApiKey: import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '',
  gpsIntervalMs: Number(import.meta.env.VITE_GPS_INTERVAL_MS ?? 4000),
} as const
