module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiKey: process.env.EXPO_PUBLIC_API_KEY || "",
    },
  };
};
