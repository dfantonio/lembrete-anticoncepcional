export default {
  android: {
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
  expo: {
    extra: {
      eas: {
        projectId: "d5aa500e-4157-4f25-908c-8c7bf12a406d",
      },
    },
    android: {
      package: "com.dfantonio.lembreteanticoncepcional",
    },
    ios: {
      bundleIdentifier: "com.dfantonio.lembreteanticoncepcional",
    },
  },
};
