import SearchIcon from "@/assets/icons/actions/search.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { CustomTextInput, KeyboardAvoidingWrapper } from "@/shared/ui";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HistoryChip } from "../../components/history-chip";
import { SearchResultItem } from "../../components/search-result-item";
import { settingsRows } from "../../config/settings-rows";
import { useSettingsSearch } from "../../hooks/use-settings-search";

export function SearchScreen() {
  const router = useRouter();
  const colors = useTheme();
  const inputRef = useRef<import("react-native").TextInput>(null);
  const { query, setQuery, results, history, add, clear } = useSettingsSearch();
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);
  const open = (title: string, route?: string) => {
    if (!route) return;
    add(title);
    router.push(route as never);
  };
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[Typography.h2, { color: colors.text }]}>‹</Text>
        </Pressable>
        <CustomTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          leftIcon={<SearchIcon width={18} height={18} />}
          inputWrapperStyle={{
            backgroundColor: colors.backgroundSelected,
            borderWidth: 0,
          }}
        />
        <View style={styles.body}>
          {query.trim() ? (
            results.map((row) => (
              <SearchResultItem
                key={row.id}
                row={row}
                onPress={() => open(row.title, row.route)}
              />
            ))
          ) : (
            <>
              <Text style={[Typography.caption, { color: colors.text }]}>
                Search history
              </Text>
              <View style={styles.chips}>
                {history.map((item) => (
                  <HistoryChip
                    key={item}
                    value={item}
                    onPress={() => {
                      const row = settingsRows.find(
                        (candidate) => candidate.title === item,
                      );
                      if (row) open(row.title, row.route);
                    }}
                  />
                ))}
              </View>
              <Pressable onPress={clear}>
                <Text
                  style={[
                    Typography.button,
                    { color: colors.accent, textAlign: "center" },
                  ]}
                >
                  Clear all
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingTop: Spacing.three },
  back: { width: 32, height: 32, justifyContent: "center" },
  body: { marginTop: Spacing.three },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
});
