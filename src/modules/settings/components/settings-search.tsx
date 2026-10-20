import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import SearchIcon from "@/assets/icons/actions/search.svg";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef } from "react";
import { BackHandler, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { SearchResultItem } from "./search-result-item";
import { useSettingsSearch } from "../hooks/use-settings-search";
import { settingsRows } from "../config/settings-rows";

export function SettingsSearch({ active, onOpen, onClose }: { active: boolean; onOpen: () => void; onClose: () => void }) {
  const colors = useTheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const input = useRef<TextInput>(null);
  const { query, setQuery, results, history, add, clear } = useSettingsSearch();
  const recent = history.filter((item) => settingsRows.some((row) => row.title === item));

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => input.current?.focus(), reducedMotion ? 0 : 330);
    return () => clearTimeout(timer);
  }, [active, reducedMotion]);

  const close = () => {
    Keyboard.dismiss();
    setQuery("");
    onClose();
  };

  useFocusEffect(useCallback(() => {
    if (!active) return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      Keyboard.dismiss();
      setQuery("");
      onClose();
      return true;
    });
    return () => back.remove();
  }, [active, onClose, setQuery]));

  const openResult = (title: string, route?: string) => {
    if (!route) return;
    add(title);
    Keyboard.dismiss();
    // Keep search visible beneath the pushed screen. Closing it first briefly
    // reveals the Settings list during the navigation transition.
    router.push(route as never);
  };

  return (
    <View style={styles.container}>
      <Pressable
        feedbackRadius={BorderRadius.full}
        feedbackEnabled={!active}
        onPress={active ? () => input.current?.focus() : onOpen}
        style={[styles.field, { backgroundColor: colors.backgroundElement }]}
        accessibilityRole={active ? undefined : "button"}
        accessibilityLabel={active ? undefined : "Search settings"}
      >
        <SearchIcon width={20} height={20} />
        <TextInput
          ref={input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search settings"
          editable={active}
          pointerEvents={active ? "auto" : "none"}
          style={[Typography.body, styles.input, { color: colors.text }]}
        />
        {active && (
          <Animated.View entering={reducedMotion ? undefined : FadeIn.delay(130).duration(150)} exiting={reducedMotion ? undefined : FadeOut.duration(100)}>
          <Pressable
            feedbackRadius={16}
            feedbackInsets={{ top: 4, bottom: 4 }}
            onPress={(event) => { event.stopPropagation(); query ? setQuery("") : close(); }}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={query ? "Clear search" : "Close search"}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
          </Animated.View>
        )}
      </Pressable>
      {active && (
      <Animated.View
        key={query.trim() ? (results.length ? "results" : "no-results") : (recent.length ? "recent" : "empty")}
        entering={reducedMotion ? undefined : FadeIn.delay(160).duration(200)}
        exiting={reducedMotion ? undefined : FadeOut.duration(140)}
        style={styles.body}
      >
        {query.trim() ? (
          results.length ? results.map((row) => (
            <SearchResultItem key={row.id} row={row} query={query.trim()} onPress={() => openResult(row.title, row.route)} />
          )) : (
            <View style={styles.empty} accessible accessibilityLiveRegion="polite">
              <SearchIcon width={28} height={28} />
              <Text style={[Typography.h3, { color: colors.text }]}>No settings found</Text>
              <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>Try a different search term.</Text>
            </View>
          )
        ) : recent.length ? (
          <>
            <View style={styles.heading}>
              <Text style={[Typography.body, { color: colors.text, fontFamily: "Geist-Medium" }]}>Recent searches</Text>
              <Pressable onPress={clear} style={styles.clearAll} hitSlop={{ top: 9, right: 8, bottom: 9, left: 8 }} feedbackRadius={BorderRadius.full} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Clear all recent searches">
                <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>Clear all</Text>
              </Pressable>
            </View>
            {recent.map((item) => (
              <Pressable key={item} onPress={() => setQuery(item)} style={styles.recentRow} feedbackRadius={0}
                feedbackBehindContent
                accessibilityRole="button" accessibilityLabel={`Search for ${item}`}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={[Typography.bodyLarge, { color: colors.text }]}>{item}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.empty} accessible accessibilityLiveRegion="polite">
            <Ionicons name="time-outline" size={28} color={colors.textMuted} />
            <Text style={[Typography.h3, { color: colors.text }]}>No recent searches</Text>
            <Text style={[Typography.bodySmall, styles.emptyDescription, { color: colors.textMuted }]}>Your recent Settings searches will appear here.</Text>
          </View>
        )}
      </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  field: { height: 48, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.three, width: "100%", flexDirection: "row", alignItems: "center", gap: Spacing.two },
  input: { flex: 1, paddingVertical: 0, minWidth: 0, fontSize: 15, lineHeight: 21 },
  iconButton: { minWidth: 32, minHeight: 40, justifyContent: "center", alignItems: "center" },
  body: { width: "100%", minHeight: 260, marginTop: Spacing.two },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.two },
  clearAll: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
  recentRow: { minHeight: 48, marginHorizontal: -Spacing.four, flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingHorizontal: Spacing.four + Spacing.two },
  empty: { minHeight: 230, alignItems: "center", justifyContent: "center", gap: Spacing.two, paddingHorizontal: Spacing.four },
  emptyDescription: { textAlign: "center" },
});
