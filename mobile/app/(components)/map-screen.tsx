import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
// ИСПРАВЛЕНИЕ: Убираем импорт несуществующего типа YaMapRef
import YaMap, { Marker } from "react-native-yamap";
import { useVehiclesStore } from "../store/vehicles-store";
import { vehiclesApi } from "../(api)/vehicles";
import type { Vehicle } from "../types/vehicle";

interface MapScreenProps {
  token: string;
}

export function MapScreen({ token }: MapScreenProps) {
  const { vehicles, setVehicles } = useVehiclesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ИСПРАВЛЕНИЕ: Используем тип YaMap для ref
  const mapRef = useRef<YaMap>(null);

  // Load initial vehicles data
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await vehiclesApi.getAll();
        setVehicles(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load vehicles"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, [setVehicles]);

  // Улучшение: Центрируем карту на маркерах после первой загрузки
  useEffect(() => {
    if (!isLoading && vehicles.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitAllMarkers();
      }, 500); // Небольшая задержка, чтобы карта успела инициализироваться
    }
  }, [isLoading, vehicles]);


  // Polling for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await vehiclesApi.getAll();
        setVehicles(data);
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [setVehicles]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YaMap
        ref={mapRef} // Привязываем ref
        initialRegion={{
          lat: 55.755864, // Начальный регион остается, но будет переопределен
          lon: 37.617698,
          zoom: 10,
        }}
        style={styles.map}
        showUserPosition={false}
      >
        {vehicles.map((vehicle: Vehicle) =>
          vehicle.position ? (
            <Marker
              key={vehicle.id}
              point={{
                lat: vehicle.position.lat,
                lon: vehicle.position.lng,
              }}
            />
          ) : null
        )}
      </YaMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
  },
});
