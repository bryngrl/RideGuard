import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlertItem } from "../components/alert-item";
import { DUMMY_ALERTS } from "../data/alerts.dummy";
import type { Alert } from "../types/alert.types";
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
  data: Alert[];
}

function groupAlertsByDate(alerts: Alert[]): AlertSection[] {
  const map = new Map<string, Alert[]>();

  // Sort descending by date first
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  for (const alert of sorted) {
    const existing = map.get(alert.date) ?? [];
    map.set(alert.date, [...existing, alert]);
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    title: getDateLabel(date),
    data,
  }));
}

//Screen
export function AlertsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const unreadCount = useMemo(
    () => DUMMY_ALERTS.filter((a) => !a.isRead).length,
    [],
  );

  const sections = useMemo<AlertSection[]>(() => {
    const filtered =
      activeTab === "unread"
        ? DUMMY_ALERTS.filter((a) => !a.isRead)
        : DUMMY_ALERTS;
    return groupAlertsByDate(filtered);
  }, [activeTab]);

  const handleAlertPress = (alert: Alert) => {
    // pass the alert id
    router.push(`/alerts/${alert.id}` as any);
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
          onPress={() => setActiveTab("all")}
          style={[
            styles.tab,
            activeTab === "all"
              ? [styles.tabActive, { backgroundColor: BrandColors.primary }]
              : [styles.tabInactive, { borderColor: theme.border }],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "all" }}
        >
          <Text
            style={[
              Typography.bodySmall,
              styles.tabText,
              {
                color: activeTab === "all" ? BrandColors.secondary : theme.text,
                fontWeight: activeTab === "all" ? "600" : "400",
              },
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("unread")}
          style={[
            styles.tab,
            activeTab === "unread"
              ? [styles.tabActive, { backgroundColor: BrandColors.primary }]
              : [styles.tabInactive, { borderColor: theme.border }],
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "unread" }}
        >
          <Text
            style={[
              Typography.bodySmall,
              styles.tabText,
              {
                color:
                  activeTab === "unread" ? BrandColors.secondary : theme.text,
                fontWeight: activeTab === "unread" ? "600" : "400",
              },
            ]}
          >
            Unread
            {unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {/* Alert Sections List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
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
          <AlertItem alert={item} onPress={handleAlertPress} />
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
