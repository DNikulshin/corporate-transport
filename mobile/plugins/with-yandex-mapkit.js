const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
} = require("@expo/config-plugins");

/**
 * Expo config plugin for react-native-yamap
 * Adds Yandex MapKit API key to AndroidManifest.xml
 */
const withYandexMapkit = (config, { apiKey } = {}) => {
  if (!apiKey) {
    throw new Error("Yandex MapKit: apiKey is required");
  }

  return withAndroidManifest(config, (cfg) => {
    const mainApplication =
      AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      "com.yandex.mapkit.ApiKey",
      apiKey
    );
    return cfg;
  });
};

module.exports = createRunOncePlugin(withYandexMapkit, "react-native-yamap");
