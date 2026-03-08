const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Исключаем служебные папки из роутинга Expo Router
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
