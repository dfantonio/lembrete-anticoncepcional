import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppColors } from "@/constants/theme";
import { ScreenName } from "@/src/types";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    console.log("Inicializando aplicação...");
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.base }}>
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
        <StatusBar style="dark" backgroundColor={AppColors.base} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
