import { Stack } from "expo-router";
import { useEffect } from "react";
import { initializeAuth } from "./store/auth-store";
import YaMap from "react-native-yamap";

export default function RootLayout() {
  useEffect(() => {
    // Initialize auth state from secure storage
    initializeAuth();

    // Initialize Yandex Maps
    const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY;
    if (apiKey) {
      YaMap.init(apiKey);
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="driver" />
      <Stack.Screen name="map" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
