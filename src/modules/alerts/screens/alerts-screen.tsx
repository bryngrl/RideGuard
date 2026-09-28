import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

import { AlertList } from "../components/alert-list";
import { getSavedAlerts } from "../services/alerts.api";
import {
  alertTimeValue,
  mapAlertFieldsToItem,
} from "../services/alerts.mapper";
import { useAlertsStore } from "../store/alerts.store";
import type { AlertItem } from "../types/alert.types";

type AlertFilter = "all" | "unread";

export function AlertsScreen() {
  const colors = useTheme();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const alerts = useAlertsStore((state) => state.alerts);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);

  const [filter, setFilter] = useState<AlertFilter>("all");

  // Load saved alerts so the list (including "All clear" rows) survives
  // restarts. They are merged by alertId to avoid clobbering realtime updates.
  useEffect(() => {
    if (!user) return;

    let active = true;

    (async () => {
      try {
        const token = await user.getIdToken();
        const saved = await getSavedAlerts(token);
        if (active) {
          mergeAlerts(saved);
        }
      } catch (error) {
        console.error("Failed to load saved alerts:", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, mergeAlerts]);

  const visibleAlerts = useMemo(() => {
    const items = [...alerts]
      .sort((a, b) => alertTimeValue(b.timeStamp) - alertTimeValue(a.timeStamp))
      .map(mapAlertFieldsToItem)
      .filter((item): item is AlertItem => item !== null);

    return filter === "unread" ? items.filter((item) => !item.read) : items;
  }, [alerts, filter]);

  const handlePressItem = (item: AlertItem) => {
    router.push({
      pathname: "/alerts/[alertId]",
      params: { alertId: item.alertId },
    });
  };

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AlertList
        data={visibleAlerts}
        ListHeaderComponent={header}
        onPressItem={handlePressItem}
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
});
