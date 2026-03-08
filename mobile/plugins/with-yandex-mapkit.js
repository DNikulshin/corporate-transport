const { AndroidConfig, createRunOncePlugin } = require("@expo/config-plugins");

/**
 * Expo config plugin for react-native-yamap
 * Adds Yandex MapKit API key to Android manifest
 */
const withYandexMapkit = (config, { apiKey }) => {
  if (!apiKey) {
    throw new Error("Yandex MapKit: apiKey is required");
  }

  // Add metadata to AndroidManifest.xml
  config = AndroidConfig.Manifest.addMetaDataItemToMainApplication(
    config,
    "com.yandex.mapkit.ApiKey",
    apiKey
  );

  return config;
};

// Export as a function that can be used in app.json plugins array
module.exports = createRunOncePlugin(withYandexMapkit, "react-native-yamap");
