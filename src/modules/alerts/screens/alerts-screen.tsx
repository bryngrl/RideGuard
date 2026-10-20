import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { END_REACHED_THRESHOLD } from "../constants";
import { useAlertsList, type AlertListStatus } from "../hooks/use-alerts";
import { AlertItem } from "../components/alert-item";
import { mapAlertFieldsToItem, alertTimeValue } from "../services/alerts.mapper";
import type { AlertFields, AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alerts-screen.styles";

// Tab Types
type TabFilter = "active" | "unread" | "archived";

const TABS: { key: TabFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];

// Active and Unread both read the backend "active" list; Unread is the active
// list filtered to unseen rows. Archived reads the "archived" list.
const TAB_STATUS: Record<TabFilter, AlertListStatus> = {
  active: "active",
  unread: "active",
  archived: "archived",
};

// Date Grouping Helper
function getDateLabel(isoDate: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (isoDate === todayStr) return "Today";
  if (isoDate === yesterdayStr) return "Yesterday";

  // Format as "September 2"
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

interface AlertSection {
  title: string;
  data: AlertItemType[];
}

function groupAlertsByDate(alerts: AlertFields[]): AlertSection[] {
  const map = new Map<string, AlertItemType[]>();

  // Sort descending by date first
  const sorted = [...alerts].sort(
    (a, b) => alertTimeValue(b.timeStamp) - alertTimeValue(a.timeStamp),
  );

  for (const alert of sorted) {
    // Get the date from timeStamp
    const dateStr = alert.timeStamp.split("T")[0];
    const mappedItem = mapAlertFieldsToItem(alert);

    if (!mappedItem) continue; // Skip invalid alerts

    const existing = map.get(dateStr) ?? [];
    map.set(dateStr, [...existing, mappedItem]);
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    title: getDateLabel(date),
    data,
  }));
}

// Screen
export function AlertsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<TabFilter>("active");

  // The selected tab's list is fetched from the backend by status, with its
  // own cursor and periodic/focus/foreground refresh (see useAlertsList).
  const { visibleAlerts, isRefreshing, isLoadingMore, hasMore, refresh, loadMore } =
    useAlertsList(TAB_STATUS[filter]);

  // Unread is the active list filtered to unseen rows; the archive tabs come
  // straight from the hook (membership is already status-correct).
  const filtered = useMemo(() => {
    if (filter === "unread") {
      return visibleAlerts.filter((a) => !a.isSeen);
    }
    return visibleAlerts;
  }, [visibleAlerts, filter]);

  // Group alerts by date
  const sections = useMemo<AlertSection[]>(() => {
    return groupAlertsByDate(filtered);
  }, [filtered]);

  const handleAlertPress = (item: AlertItemType) => {
    router.push({
      pathname: "/alerts/[alertId]",
      params: { alertId: item.alertId },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[Typography.largeTitle, { color: theme.text }]}>
          Alerts
        </Text>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const selected = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[
                styles.tab,
                selected
                  ? [styles.tabActive, { backgroundColor: BrandColors.primary }]
                  : [styles.tabInactive, { borderColor: theme.border }],
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  Typography.bodySmall,
                  styles.tabText,
                  {
                    color: selected ? BrandColors.secondary : theme.text,
                    fontWeight: selected ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Alert Sections List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.alertId}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.textMuted}
          />
        }
        onEndReached={() => {
          if (hasMore && !isLoadingMore) loadMore();
        }}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              Typography.bodyLarge,
              styles.sectionHeader,
              { color: theme.textMuted },
            ]}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <AlertItem alert={item} onPress={() => handleAlertPress(item)} />
        )}
        SectionSeparatorComponent={() => (
          <View style={styles.sectionSeparator} />
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              style={styles.footerSpinner}
              size="small"
              color={theme.textMuted}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[Typography.medium, { color: theme.textInactive }]}>
              No alerts to show.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
