import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useAuthStore } from '../store/auth-store';
import { LOCATION_TASK_NAME } from '../tasks/location-task'; // Импортируем нашу задачу

// Убедимся, что TaskManager знает о нашей задаче.
// Этот импорт должен быть выполнен где-то в корне приложения, но для простоты разместим здесь.
import '../tasks/location-task';

export type ShiftStatus = 'idle' | 'active' | 'error';

interface UseGpsSenderResult {
  status: ShiftStatus;
  errorMessage: string | null;
  startShift: () => Promise<void>;
  stopShift: () => Promise<void>;
}

export function useGpsSender(): UseGpsSenderResult {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<ShiftStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Проверяем, активна ли задача, при монтировании компонента
  useEffect(() => {
    const checkTaskStatus = async () => {
      const isActive = await TaskManager.isTaskRegisteredAsync(
        LOCATION_TASK_NAME
      );
      if (isActive) {
        setStatus('active');
      }
    };
    checkTaskStatus();
  }, []);

  const startShift = useCallback(async () => {
    if (!user?.vehicleId) {
      setErrorMessage('Нет привязанного транспортного средства');
      setStatus('error');
      return;
    }

    // 1. Запрашиваем разрешения для фона
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      setErrorMessage('Разрешение на геолокацию (foreground) не получено');
      setStatus('error');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
        setErrorMessage('Разрешение на геолокацию (background) не получено');
        setStatus('error');
        return;
    }

    try {
      // 2. Запускаем фоновую задачу
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 секунд
        distanceInterval: 10, // 10 метров
        showsBackgroundLocationIndicator: true, // Показываем индикатор в строке состояния
        foregroundService: {
          notificationTitle: 'Отслеживание активно',
          notificationBody: 'Приложение отправляет ваши координаты на сервер.',
          notificationColor: '#333333',
        },
      });

      const isRunning = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
      );

      if(isRunning) {
        setStatus('active');
        setErrorMessage(null);
      } else {
        throw new Error("Не удалось запустить фоновую задачу")
      }

    } catch (error) {
      console.error(error);
      setErrorMessage('Ошибка запуска фонового отслеживания');
      setStatus('error');
    }
  }, [user]);

  const stopShift = useCallback(async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setStatus('idle');
      setErrorMessage(null);
    } catch (error) {
        console.error(error)
        setErrorMessage("Ошибка остановки фонового отслеживания")
        setStatus('error');
    }
  }, []);

  return { status, errorMessage, startShift, stopShift };
}
