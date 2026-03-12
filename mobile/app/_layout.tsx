import { Stack } from "expo-router";
import { useEffect } from "react";
import { initializeAuth } from "./store/auth-store";
// import YaMap from "react-native-yamap";

// Ключ для карт внедряется нативно через плагин, поэтому инициализация в JS не требуется.
// YaMap.init() был удален, чтобы избежать ошибок и дублирования.

export default function RootLayout() {
  useEffect(() => {
    // Initialize auth state from secure storage
    initializeAuth();
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
