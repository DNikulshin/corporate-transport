import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGpsSender } from "../hooks/use-gps-sender";

export function ShiftControls() {
  const { status, errorMessage, startShift, stopShift } = useGpsSender();

  return (
    <View style={styles.container}>
      {status === "idle" || status === "error" ? (
        <TouchableOpacity style={styles.startButton} onPress={startShift}>
          <Text style={styles.buttonText}>Начать смену</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopButton} onPress={stopShift}>
          <Text style={styles.buttonText}>Завершить смену</Text>
        </TouchableOpacity>
      )}

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#1e293b",
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
