import { Ionicons } from "@expo/vector-icons";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  SectionList,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { END_REACHED_THRESHOLD } from "../constants";
import { useAlertsList, type AlertListStatus } from "../hooks/use-alerts";
import { AlertItem } from "../components/alert-item";
import { AlertsSkeleton } from "../components/alerts-skeleton";
import { mapAlertFieldsToItem, alertTimeValue } from "../services/alerts.mapper";
import type { AlertFields, AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alerts-screen.styles";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useLoadingCountsStore, type LoadingList } from "@/shared/store/loading-counts.store";

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
function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateLabel(isoDate: string): string {
  const today = new Date();
  const todayStr = localDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = localDateKey(yesterday);

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
    const date = new Date(alert.timeStamp);
    const dateStr = Number.isNaN(date.getTime()) ? "unknown" : localDateKey(date);
    const mappedItem = mapAlertFieldsToItem(alert);

    if (!mappedItem) continue; // Skip invalid alerts

    const existing = map.get(dateStr) ?? [];
    map.set(dateStr, [...existing, mappedItem]);
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    title: date === "unknown" ? "Unknown date" : getDateLabel(date),
    data,
  }));
}

// Screen
export function AlertsScreen({ archivedOnly = false }: { archivedOnly?: boolean } = {}) {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<TabFilter>(archivedOnly ? "archived" : "active");
  const { bottom } = useSafeAreaInsets();
  const uid = useAuthStore((state) => state.user?.uid);
  const countKey: LoadingList = `alerts:${filter}`;
  const loadingCount = useLoadingCountsStore((state) => uid ? state.counts[uid]?.[countKey] : undefined);
  const rememberCount = useLoadingCountsStore((state) => state.remember);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuRight, setMenuRight] = useState(24);
  const [listHeight, setListHeight] = useState(0);
  const screenRef = useRef<View>(null);
  const filterRef = useRef<View>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const menuProgress = useSharedValue(0);
  const availableFilters = FILTERS;
  const selectedFilter = availableFilters.find((item) => item.key === filter) ?? FILTERS[0];

  const positionMenu = useCallback((openAfterMeasure = false) => {
    filterRef.current?.measureInWindow((filterX, filterY, filterWidth, filterHeight) => {
      screenRef.current?.measureInWindow((screenX, screenY, screenWidth) => {
        setMenuTop(Math.max(0, filterY - screenY + filterHeight + 6));
        setMenuRight(Math.max(12, screenWidth - (filterX - screenX + filterWidth)));
        if (openAfterMeasure) setMenuOpen(true);
      });
    });
  }, []);

  useEffect(() => {
    if (menuOpen) positionMenu();
  }, [menuOpen, positionMenu, windowWidth, windowHeight]);

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
  const { visibleAlerts, isRefreshing, isLoadingMore, isInitialLoading, error: loadError, hasMore, refresh, loadMore } =
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
  const showSkeleton = sections.length === 0 && isInitialLoading;
  useEffect(() => {
    if (uid && !isInitialLoading && !isRefreshing && !isLoadingMore && !loadError) {
      rememberCount(uid, countKey, sections.reduce((total, section) => total + section.data.length, 0));
    }
  }, [uid, countKey, sections, isInitialLoading, isRefreshing, isLoadingMore, loadError, rememberCount]);

  const handleAlertPress = (item: AlertItemType) => {
    router.push({
      pathname: "/alerts/[alertId]",
      params: { alertId: item.alertId },
    });
  };

  const list = (
<SectionList
        onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
        sections={sections}
        keyExtractor={(item) => item.alertId}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, archivedOnly && { paddingTop: Spacing.three, paddingBottom: bottom + Spacing.four }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing && !showSkeleton}
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
              Typography.medium,
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
        ListEmptyComponent={showSkeleton ? (
          <AlertsSkeleton viewportHeight={listHeight} count={loadingCount} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[Typography.medium, { color: theme.textMuted }]}>
              {filter === "unread" ? "No unread alerts."
                : filter === "archived" ? "No archived alerts."
                : "No active alerts yet."}
            </Text>
          </View>
        )}
      />
  );

  if (archivedOnly) return <PageLayout title="Archives" scrollable={false} contentFlush
    onBack={() => router.canGoBack() ? router.back() : router.replace("/settings")}>{list}</PageLayout>;

  return (
    <SafeAreaView
      ref={screenRef}
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
        <View ref={filterRef} style={styles.filterAnchor}>
          <Pressable
            onPress={() => {
              if (menuOpen) setMenuOpen(false);
              else positionMenu(true);
            }}
            style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            feedbackRadius={20}
            feedbackBehindContent
            accessibilityRole="button"
            accessibilityLabel={`Filter alerts: ${selectedFilter.label}`}
            accessibilityState={{ expanded: menuOpen }}
          >
            <Text style={[Typography.bodySmall, styles.filterLabel, { color: theme.text }]} numberOfLines={1}>
              {selectedFilter.label}
            </Text>
            <Ionicons
              name={menuOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color={theme.text}
            />
          </Pressable>
        </View>
      </View>
      <Animated.View
        pointerEvents={menuOpen ? "auto" : "none"}
        accessibilityElementsHidden={!menuOpen}
        importantForAccessibility={menuOpen ? "auto" : "no-hide-descendants"}
        style={[styles.menu, { top: menuTop, right: menuRight, backgroundColor: theme.modalSurface }, menuMotion]}
      >
        <View style={styles.menuSurface}>
          {availableFilters.map((option, index) => {
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
                  index > 0 && [styles.menuItemBorder, { borderTopColor: theme.border }],
                  selected && [styles.menuItemSelected, { backgroundColor: theme.backgroundSelected }],
                ]}
                feedbackBehindContent
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
              >
                <Text style={[Typography.bodySmall, styles.menuItemText, { color: theme.text }]}>
                  {option.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={18} color={theme.text} />}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Alert Sections List */}
      {list}
    </SafeAreaView>
  );
}
