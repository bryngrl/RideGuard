import SearchIcon from "@/assets/icons/actions/search.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
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
        <CustomTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          style={[Typography.body, { color: colors.text }]}
          inputStyle={{
            paddingVertical: 0,
          }}
          leftIcon={<SearchIcon width={18} height={18} />}
          inputWrapperStyle={{
            backgroundColor: "#F8F8F8",
            borderWidth: 0,
            height: 40,
            minHeight: 40,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.three,
          }}
        />
        <View style={styles.body}>
          {query.trim() ? (
            results.map((row) => (
              <SearchResultItem
                key={row.id}
                row={row}
                query={query}
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
                    Typography.medium,
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
