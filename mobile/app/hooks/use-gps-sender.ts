import { useEffect, useRef, useState, useCallback } from "react";
import * as Location from "expo-location";
import { WsClient } from "../lib/websocket-client";
import { useAuthStore } from "../store/auth-store";
import { env } from "../config/env";

export type ShiftStatus = "idle" | "active" | "error";

interface UseGpsSenderResult {
  status: ShiftStatus;
  errorMessage: string | null;
  startShift: () => void;
  stopShift: () => void;
}

export function useGpsSender(): UseGpsSenderResult {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WsClient | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );

  const [status, setStatus] = useState<ShiftStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startShift = useCallback(() => {
    if (!user?.vehicleId || !accessToken) {
      setErrorMessage("Нет привязанного транспортного средства");
      return;
    }

    setStatus("active");
    setErrorMessage(null);

    const ws = new WsClient("/api/tracking/ws");
    wsRef.current = ws;

    ws.connect(accessToken);

    // Request location permissions
    (async () => {
      try {
        const { status: locStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (locStatus !== "granted") {
          setErrorMessage("Разрешение на геолокацию не получено");
          setStatus("error");
          return;
        }

        // Watch position
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: env.gpsIntervalMs,
            distanceInterval: 5, // Update every 5 meters
          },
          (location) => {
            const payload = {
              vehicleId: user.vehicleId!,
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading ?? 0,
              speed: location.coords.speed
                ? Math.round(location.coords.speed * 3.6)
                : 0,
              accuracy: location.coords.accuracy,
              timestamp: Date.now(),
            };

            ws.send({ type: "position", data: payload });
          }
        );
      } catch {
        setErrorMessage("Ошибка определения местоположения");
        setStatus("error");
      }
    })();
  }, [user, accessToken]);

  const stopShift = useCallback(() => {
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    wsRef.current?.disconnect();
    wsRef.current = null;
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      locationSubscriptionRef.current?.remove();
      wsRef.current?.disconnect();
    };
  }, []);

  return { status, errorMessage, startShift, stopShift };
}
