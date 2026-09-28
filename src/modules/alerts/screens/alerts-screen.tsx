import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

import { AlertList } from "../components/alert-list";
import { ALERT_ICON } from "../constants";
import { useAlerts } from "../hooks/use-alerts";

export function AlertsScreen() {
  const colors = useTheme();
  const {
    visibleAlerts,
    filter,
    setFilter,
    isLoadingMore,
    showLoadedMessage,
    handleEndReached,
    openAlertDetails,
  } = useAlerts();

  const header = (
    <View>
      {/* TITLE */}
      <Text
        style={[Typography.largeTitle, styles.title, { color: colors.text }]}
      >
        Alerts
      </Text>

      {/* FILTER PILLS */}
      <View style={styles.filters}>
        <FilterPill
          label="All"
          active={filter === "all"}
          onPress={() => setFilter("all")}
          colors={colors}
        />
        <FilterPill
          label="Unread"
          active={filter === "unread"}
          onPress={() => setFilter("unread")}
          colors={colors}
        />
      </View>

      {/* SECTION HEADER */}
      <Text
        style={[
          Typography.h3,
          styles.sectionHeader,
          { color: colors.textMuted },
        ]}
      >
        Today
      </Text>
    </View>
  );

  const footer =
    isLoadingMore || showLoadedMessage ? (
      <View style={styles.footer}>
        {isLoadingMore ? (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              Loading more…
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name={ALERT_ICON.LOADED}
              size={18}
              color={colors.success}
            />
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              Loaded successfully
            </Text>
          </>
        )}
      </View>
    ) : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AlertList
        data={visibleAlerts}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onPressItem={openAlertDetails}
        onEndReached={handleEndReached}
      />
      <BottomNavigation />
    </SafeAreaView>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>;
}

function FilterPill({ label, active, onPress, colors }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? colors.primary : "transparent",
          borderColor: colors.primary,
        },
      ]}
    >
      <Text
        style={[
          Typography.h4,
          { color: active ? colors.textInverse : colors.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  filters: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  pill: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 2,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
});
