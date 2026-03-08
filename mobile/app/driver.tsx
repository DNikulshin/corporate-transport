import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { useAuthStore } from "./store/auth-store";
import { ShiftControls } from "./components/shift-controls";
import { MapScreen } from "./components/map-screen";

export default function DriverScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlsContainer}>
        <ShiftControls />
      </View>
      <View style={styles.mapContainer}>
        <MapScreen token={accessToken!} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  controlsContainer: {
    padding: 16,
    zIndex: 1,
  },
  mapContainer: {
    flex: 1,
  },
});
