import { SearchScreen } from "@/modules/settings";
import { Stack } from "expo-router";

export default function SearchRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          animation: "fade",
          headerShown: false,
        }}
      />
      <SearchScreen />
    </>
  );
}
