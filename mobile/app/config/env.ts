import { Platform } from "react-native";

export const env = {
  apiUrl: "http://192.168.1.111:4000",
  wsUrl:
    Platform.OS === "android"
      ? "ws://192.168.1.111:4000"
      : "ws://192.168.1.111:4000",
  gpsIntervalMs: 4000,
} as const;
