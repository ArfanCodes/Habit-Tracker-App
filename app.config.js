import "dotenv/config";

export default {
  expo: {
    name: "Habit Tracker App",
    slug: "habit-tracker-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
    },

    android: {
      package: "com.habit.myapp", // unique reverse-domain style
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["INTERNET"], // required for Appwrite network calls
    },

    web: {
      favicon: "./assets/images/favicon.png",
    },

    // Appwrite environment variables + EAS project ID
    extra: {
      EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      EXPO_PUBLIC_APPWRITE_PROJECT_ID:
        process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      EXPO_PUBLIC_APPWRITE_PLATFORM: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
      EXPO_PUBLIC_DB_ID: process.env.EXPO_PUBLIC_DB_ID,
      EXPO_PUBLIC_HABITS_COLLECTION_ID:
        process.env.EXPO_PUBLIC_HABITS_COLLECTION_ID,
      EXPO_PUBLIC_COMPLETIONS_COLLECTION_ID:
        process.env.EXPO_PUBLIC_COMPLETIONS_COLLECTION_ID,

      eas: {
        projectId: "55efb518-33e7-49f6-9e2a-89cd2c643db1",
      },
    },

    scheme: "habittracker", // unique app scheme
    owner: "denji05", // 👈 just added this line
  },
};
