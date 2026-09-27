import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { AlertListItem } from "@/features/alerts/components/alert-list-item";
import { alertKey, useAlerts } from "@/features/alerts/hooks/use-alerts";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useTheme } from "@/hooks/use-theme";

export default function DashboardScreen() {
  const theme = useTheme();
  const { alerts, isLoading, error, refetch } = useAlerts();
  const { logout, isLoggingOut, error: logoutError } = useLogout();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ThemedText type="h1" style={styles.title}>
        Alerts
      </ThemedText>

      {/* TODO: move this to a real account/settings screen. */}
      <View style={styles.logoutContainer}>
        <Button
          title="Log out"
          variant="danger"
          isLoading={isLoggingOut}
          disabled={isLoggingOut}
          onPress={() => {
            void logout();
          }}
        />

        {logoutError ? (
          <ThemedText type="body" style={{ color: theme.error }}>
            {logoutError}
          </ThemedText>
        ) : null}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => alertKey(item)}
        renderItem={({ item }) => <AlertListItem alert={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <ThemedText type="body" themeColor="textMuted" style={styles.empty}>
              {error ?? "No alerts yet. You're all clear."}
            </ThemedText>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  title: {
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  logoutContainer: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  listContent: {
    paddingBottom: Spacing.six,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    textAlign: "center",
    marginTop: Spacing.seven,
  },
});
