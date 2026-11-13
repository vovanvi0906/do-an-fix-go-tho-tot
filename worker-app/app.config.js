module.exports = ({ config }) => {
  if (process.env.FACE_RESEARCH_APP === 'true') {
    return {
      ...config,
      name: 'FixGo Face Research', slug: 'fixgo-face-research', scheme: 'fixgoresearch',
      android: { ...config.android, package: 'com.fixgo.faceresearch', googleServicesFile: undefined,
        permissions: ['android.permission.INTERNET', 'android.permission.CAMERA'] },
      plugins: [['expo-router', { root: 'research-app' }], ['expo-image-picker', {
        cameraPermission: 'Camera nghiên cứu chỉ dùng sau khi consent được phê duyệt.',
        photosPermission: false, microphonePermission: false,
      }]],
      extra: { router: { root: 'research-app', origin: false } },
    };
  }
  return ({
  ...config,
  ...(process.env.EXPO_EAS_SLUG ? { slug: process.env.EXPO_EAS_SLUG } : {}),
  extra: {
    ...config.extra,
    eas: { ...config.extra?.eas, ...(process.env.EXPO_EAS_PROJECT_ID ? { projectId: process.env.EXPO_EAS_PROJECT_ID } : {}) },
  },
});
};
