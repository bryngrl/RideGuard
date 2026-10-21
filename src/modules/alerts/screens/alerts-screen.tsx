import { Ionicons } from "@expo/vector-icons";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { END_REACHED_THRESHOLD } from "../constants";
import { useAlertsList, type AlertListStatus } from "../hooks/use-alerts";
import { AlertItem } from "../components/alert-item";
import { mapAlertFieldsToItem, alertTimeValue } from "../services/alerts.mapper";
import type { AlertFields, AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alerts-screen.styles";

type TabFilter = "active" | "unread" | "archived";

const FILTERS: { key: TabFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];

// Active and Unread share the non-archived view; Unread keeps unseen rows.
// Archived uses the same saved-alerts API and the returned archive flag.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(68);
  const reducedMotion = useReducedMotion();
  const menuProgress = useSharedValue(0);
  const selectedFilter = FILTERS.find((item) => item.key === filter)!;

  useEffect(() => {
    menuProgress.value = reducedMotion
      ? Number(menuOpen)
      : withTiming(Number(menuOpen), {
          duration: menuOpen ? 180 : 150,
          easing: Easing.out(Easing.cubic),
        });
  }, [menuOpen, menuProgress, reducedMotion]);

  const menuMotion = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [{ translateY: (1 - menuProgress.value) * -6 }],
  }));

  useFocusEffect(useCallback(() => () => setMenuOpen(false), []));
  useEffect(() => {
    if (!menuOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setMenuOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [menuOpen]);

  // The selected view loads saved alerts with its own cursor and the existing
  // periodic/focus/foreground refresh (see useAlertsList).
  const { visibleAlerts, isRefreshing, isLoadingMore, hasMore, refresh, loadMore } =
    useAlertsList(TAB_STATUS[filter]);

  // Unread filters the active view to unseen rows. Archive membership is
  // already resolved by the hook.
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
      {menuOpen && (
        <Pressable
          style={styles.dismissLayer}
          onPress={() => setMenuOpen(false)}
          feedbackEnabled={false}
          accessibilityLabel="Close alert filters"
        />
      )}
      <View style={styles.header} pointerEvents="box-none">
        <Text style={[Typography.largeTitle, { color: theme.text }]}>
          Alerts
        </Text>
        <View
          style={styles.filterAnchor}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            setMenuTop(y + height + 6);
          }}
        >
          <Pressable
            onPress={() => setMenuOpen((open) => !open)}
            style={styles.filterButton}
            feedbackRadius={20}
            feedbackBehindContent
            accessibilityRole="button"
            accessibilityLabel={`Filter alerts: ${selectedFilter.label}`}
            accessibilityState={{ expanded: menuOpen }}
          >
            <Text style={[Typography.bodySmall, styles.filterLabel]} numberOfLines={1}>
              {selectedFilter.label}
            </Text>
            <Ionicons
              name={menuOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color={BrandColors.primary}
            />
          </Pressable>
        </View>
      </View>
      <Animated.View
        pointerEvents={menuOpen ? "auto" : "none"}
        accessibilityElementsHidden={!menuOpen}
        importantForAccessibility={menuOpen ? "auto" : "no-hide-descendants"}
        style={[styles.menu, { top: menuTop }, menuMotion]}
      >
        <View style={styles.menuSurface}>
          {FILTERS.map((option, index) => {
            const selected = filter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  setMenuOpen(false);
                  if (!selected) setFilter(option.key);
                }}
                style={[
                  styles.menuItem,
                  index > 0 && styles.menuItemBorder,
                  selected && styles.menuItemSelected,
                ]}
                feedbackBehindContent
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
              >
                <Text style={[Typography.bodySmall, styles.menuItemText]}>
                  {option.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={18} color={BrandColors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

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
            <Text style={[Typography.medium, { color: theme.textMuted }]}>
              {filter === "unread" ? "No unread alerts." : filter === "archived" ? "No archived alerts." : "No active alerts yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
