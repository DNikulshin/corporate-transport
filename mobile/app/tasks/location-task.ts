import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { WsClient } from '../lib/websocket-client';
// ИСПРАВЛЕНИЕ: Импортируем authStorage, который умеет работать с AsyncStorage
import { authStorage } from '../lib/auth-storage';

export const LOCATION_TASK_NAME = 'background-location-task';

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask<LocationTaskData>(
  LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }

    if (data) {
      const { locations } = data;
      console.log('Background location update received:', locations.length);

      // ИСПРАВЛЕНИЕ: Получаем пользователя и токен напрямую из хранилища
      const [user, accessToken] = await Promise.all([
        authStorage.getUser(),
        authStorage.getAccessToken(),
      ]);

      if (!user || !accessToken || !user.vehicleId) {
        console.error('No auth data or vehicleId in background task');
        // Останавливаем задачу, если нет данных для авторизации
        Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        return;
      }

      const ws = new WsClient('/api/tracking/ws');
      // Создаем короткоживущее соединение для каждой пачки обновлений
      await ws.connect(accessToken);

      locations.forEach((location) => {
        const payload = {
          vehicleId: user.vehicleId!,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          heading: location.coords.heading ?? 0,
          speed: location.coords.speed
            ? Math.round(location.coords.speed * 3.6)
            : 0,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        };
        ws.send({ type: 'position', data: payload });
      });

      // Отключаемся после отправки
      setTimeout(() => ws.disconnect(), 1000);
    }
  }
);
