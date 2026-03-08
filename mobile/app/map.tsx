import React from "react";
import { View, StyleSheet } from "react-native";
import { MapScreen } from "./components/map-screen";
import { useAuthStore } from "./store/auth-store";

export default function MapPage() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <View style={styles.container}>
      <MapScreen token={accessToken!} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
