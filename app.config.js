module.exports = ({ config }) => {
  const extra = config.extra || {};

  return {
    ...config,
    extra: {
      ...extra,
      versionCode: config.android?.versionCode || extra.versionCode || 1,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "",
      apiKey: process.env.EXPO_PUBLIC_API_KEY || "",
      wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL || "",
      imageBaseUrl: process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "",
      gameLauncherBaseUrl: process.env.EXPO_PUBLIC_GAME_LAUNCHER_BASE_URL || "",
    },
  };
};
