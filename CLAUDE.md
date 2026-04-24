# corporate-transport — AI Rules

## Architecture
corporate-transport/
├── backend/ # Fastify + WebSocket + SSE
├── frontend/ # React PWA (Vite)
├── mobile/ # React Native (Expo)
├── docker-compose.yml
└── packages/ (shared types)

text

## Data Flow
1. **Driver** открывает PWA или мобильное приложение, включает трансляцию GPS.
2. WebSocket отправляет позиции на бэкенд → Redis (TTL 600s) → PostgreSQL лог.
3. Redis Pub/Sub рассылает позиции всем SSE-клиентам.
4. **Employee** видит карту с реальным временем (SSE или polling).

## Tech Stack
- Backend: Fastify, @fastify/websocket, Redis, Prisma (PostgreSQL)
- Frontend: React 19, Tailwind, Yandex Maps, PWA (Workbox), IndexedDB
- Mobile: Expo 54, react-native-yamap, expo-location, expo-task-manager

## Key Decisions
- SSE для real-time обновлений (для сотрудников), WebSocket только для водителей.
- Офлайн-очередь GPS координат в IndexedDB (фронтенд) и AsyncStorage (мобильное приложение).
- Фоновый сервис геолокации на мобильном через `expo-task-manager`.

## Conventions
- Строгая типизация через TypeScript.
- API base: `/api/auth`, `/api/vehicles`, `/api/tracking`.
- Все сервисные слои разделены: `_api.ts`, `_ws-client.ts`, `_geo-service.ts`.

## Security
- JWT access + refresh токены.
- CORS настроен на конкретные домены (включая ngrok для разработки).
- `wakeLock` для предотвращения сна при активной смене.