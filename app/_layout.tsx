import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { ThemeProvider, useAppTheme } from "@/src/contexts/ThemeContext";
import { ScreenName } from "@/src/types";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme, colors } = useAppTheme();

  useEffect(() => {
    console.log("Inicializando aplicação...");
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name={ScreenName.RoleSelect} />
          <Stack.Screen name={ScreenName.MainGF} />
          <Stack.Screen name={ScreenName.MainBF} />
          <Stack.Screen name={ScreenName.CalendarHistory} />
        </Stack>
        <StatusBar
          style={theme === "dark" ? "light" : "dark"}
          backgroundColor={colors.base}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
