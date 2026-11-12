module.exports = ({ config }) => ({
  ...config,
  ...(process.env.EXPO_EAS_SLUG ? { slug: process.env.EXPO_EAS_SLUG } : {}),
  extra: {
    ...config.extra,
    eas: { ...config.extra?.eas, ...(process.env.EXPO_EAS_PROJECT_ID ? { projectId: process.env.EXPO_EAS_PROJECT_ID } : {}) },
  },
});
