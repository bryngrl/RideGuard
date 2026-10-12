import { Stack } from "expo-router";
import { SearchScreen } from "@/modules/settings";

export default function SearchRoute() {
  return <>
    <Stack.Screen options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
    <SearchScreen />
  </>;
}
