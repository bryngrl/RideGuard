import { SearchScreen } from "@/modules/settings";
import { Stack } from "expo-router";

export default function SearchRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <SearchScreen />
    </>
  );
}
