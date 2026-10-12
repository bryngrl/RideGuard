import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAbly } from "@/shared/hooks/use-ably";
import { useAlertsStore } from "../store/alerts.store";
import { AlertItem } from "../components/alert-item";
import { mapAlertFieldsToItem, alertTimeValue } from "../services/alerts.mapper";
import type { AlertFields, AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alerts-screen.styles";

// Tab Types
type TabFilter = "all" | "unread";

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
  const [filter, setFilter] = useState<TabFilter>("all");

  // Mount realtime subscription
  useAbly();

  // Get raw alerts from store
  const alerts = useAlertsStore((state) => state.alerts);

  // Filter based on filter selection
  const filtered = useMemo(() => {
    if (filter === "unread") {
      return alerts.filter((a) => !a.isSeen);
    }
    return alerts;
  }, [alerts, filter]);

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
        <Pressable
          onPress={() => setFilter("all")}
          style={[
            styles.tab,
            filter === "all"
              ? [styles.tabActive, { backgroundColor: BrandColors.primary }]
              : [styles.tabInactive, { borderColor: theme.border }],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === "all" }}
        >
          <Text
            style={[
              Typography.bodySmall,
              styles.tabText,
              {
                color:
                  filter === "all" ? BrandColors.secondary : theme.text,
                fontWeight: filter === "all" ? "600" : "400",
              },
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter("unread")}
          style={[
            styles.tab,
            filter === "unread"
              ? [styles.tabActive, { backgroundColor: BrandColors.primary }]
              : [styles.tabInactive, { borderColor: theme.border }],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === "unread" }}
        >
          <Text
            style={[
              Typography.bodySmall,
              styles.tabText,
              {
                color:
                  filter === "unread" ? BrandColors.secondary : theme.text,
                fontWeight: filter === "unread" ? "600" : "400",
              },
            ]}
          >
            Unread
          </Text>
        </Pressable>
      </View>

      {/* Alert Sections List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.alertId}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[Typography.medium, { color: theme.textInactive }]}>
              No alerts to show.
            </Text>
          </View>
        }
      />
      <BottomNavigation />
    </SafeAreaView>
  );
}