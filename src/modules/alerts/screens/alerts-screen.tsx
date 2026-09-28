import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

const PAGE_SIZE = 10;
const SUCCESS_MESSAGE_DURATION = 1800;

export function AlertsScreen() {
  const colors = useTheme();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const alerts = useAlertsStore((state) => state.alerts);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);

  const [filter, setFilter] = useState<AlertFilter>("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoadedMessage, setShowLoadedMessage] = useState(false);

  // Pagination bookkeeping kept in refs so the loader stays stable across pages.
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const initializedUidRef = useRef<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAlerts = useCallback(
    async (mode: "initial" | "more") => {
      if (!user || isFetchingRef.current) return;
      if (mode === "more" && (!hasMoreRef.current || !cursorRef.current))
        return;

      isFetchingRef.current = true;
      if (mode === "more") setIsLoadingMore(true);

      try {
        const token = await user.getIdToken();
        const page = await getSavedAlerts(token, {
          limit: PAGE_SIZE,
          cursor:
            mode === "more" ? (cursorRef.current ?? undefined) : undefined,
        });

        // Merge by alertId so realtime updates and earlier pages aren't clobbered.
        mergeAlerts(page.alerts);
        cursorRef.current = page.nextCursor;
        hasMoreRef.current = page.nextCursor !== null;

        if (mode === "more") {
          setShowLoadedMessage(true);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(
            () => setShowLoadedMessage(false),
            SUCCESS_MESSAGE_DURATION,
          );
        }
      } catch (error) {
        console.error("Failed to load saved alerts:", error);
      } finally {
        isFetchingRef.current = false;
        if (mode === "more") setIsLoadingMore(false);
      }
    },
    [user, mergeAlerts],
  );

  // Initial page load, once per signed-in user. Guarding on uid prevents the
  // effect from re-firing (and re-fetching page 1) when the Firebase user
  // reference changes on token refresh.
  useEffect(() => {
    if (!user) {
      initializedUidRef.current = null;
      return;
    }

    if (initializedUidRef.current === user.uid) return;
    initializedUidRef.current = user.uid;

    cursorRef.current = null;
    hasMoreRef.current = true;
    loadAlerts("initial");
  }, [user, loadAlerts]);

  // Clear any pending success-message timer on unmount.
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Load the next page as the list nears its end. The cursor / in-flight guards
  // inside loadAlerts prevent over-fetching and duplicate requests.
  const handleEndReached = () => {
    loadAlerts("more");
  };

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
              name="checkmark-circle"
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
        onPressItem={handlePressItem}
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
