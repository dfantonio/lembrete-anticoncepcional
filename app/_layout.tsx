import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AppColors } from "@/constants/theme";
import { ScreenName } from "@/src/types";

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}
