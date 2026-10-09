import { Href, useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getInstallationId,
  unregisterPushNotification,
} from "@/modules/notifications";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button, KeyboardAvoidingWrapper } from "@/shared/ui";

// Raw layout array parsed directly from your terminal output
const RAW_ROUTES = [
  "/",
  "/privacy\\privacy",
  "/terms\\terms",
  "\\(tabs)\\alerts",
  "\\(tabs)\\camera",
  "\\(tabs)\\index",
  "\\(tabs)\\settings",
  "\\alerts\\[alertId]",
  "\\contact\\add-contact",
  "\\contact\\edit-contact",
  "\\contact\\index",
  "\\devices\\button\\index",
  "\\devices\\button\\test-page",
  "\\devices\\camera\\camera-preview",
  "\\devices\\camera\\index",
  "\\devices\\index",
  "\\register\\complete-setup",
  "\\register\\emergency-contact",
  "\\register\\permission",
  "\\register\\profile",
  "\\register\\provision",
  "\\register\\vehicle",
  "\\sign-in",
  "\\sos\\active",
  "\\sos\\countdown",
  "\\sos\\index",
];

// Automated routing cleaner function (pulled outside component to prevent re-computation)
const getCleanRoutes = () => {
  const uniqueRoutes = new Set<string>();

  RAW_ROUTES.forEach((route) => {
    let clean = route.replace(/\\/g, "/");
    clean = clean.replace(/\/\([^)]+\)/g, "");

    const segments = clean.split("/").filter(Boolean);
    if (segments.length === 2 && segments[0] === segments[1]) {
      clean = `/${segments[0]}`;
    }

    if (clean.endsWith("/index")) {
      clean = clean.substring(0, clean.length - 6);
    }

    if (!clean.startsWith("/")) {
      clean = `/${clean}`;
    }
    if (clean === "") {
      clean = "/";
    }

    if (clean.includes("[") || clean === "/_sitemap") return;

    uniqueRoutes.add(clean);
  });

  return Array.from(uniqueRoutes);
};

const CLEANED_ROUTES = getCleanRoutes();

export function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [showDevMenu, setShowDevMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const auth = getAuth();

      // Remove this device's push registration while we still hold a valid
      // Firebase token. Best-effort: never block logout if it fails.
      try {
        const current = auth.currentUser;
        if (current) {
          const [installationId, token] = await Promise.all([
            getInstallationId(),
            current.getIdToken(),
          ]);
          await unregisterPushNotification(token, installationId);
        }
      } catch (error) {
        console.error("Failed to unregister push notifications:", error);
      }

      await signOut(auth);
      router.replace("/(public)/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again.",
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.keyboardWrapper}>
        <View style={styles.content}>
          <Text style={[Typography.largeTitle, { color: colors.text }]}>
            Settings
          </Text>

          <View style={styles.logout}>
            <Button
              title="Log out"
              variant="danger"
              size="md"
              fullWidth
              onPress={handleLogout}
            />
          </View>

          {/* Dev-only Section with Automated Tap-To-Visit List */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <Pressable onPress={() => setShowDevMenu((prev) => !prev)}>
                <Text
                  style={[
                    Typography.caption,
                    { color: colors.primary, paddingVertical: 10 },
                  ]}
                >
                  {showDevMenu ? "▼ Hide Dev Sitemap" : "▲ Show Dev Sitemap"}
                </Text>
              </Pressable>

              {showDevMenu && (
                <ScrollView
                  style={[styles.devMenu, { borderColor: colors.primary }]}
                  nestedScrollEnabled
                >
                  {CLEANED_ROUTES.map((route) => (
                    <Pressable
                      key={route}
                      style={styles.devRouteButton}
                      onPress={() => router.push(route as Href)}
                    >
                      <Text
                        style={[
                          Typography.body,
                          { color: colors.text, fontSize: 12 },
                        ]}
                      >
                        {route}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardWrapper: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  logout: {
    marginVertical: Spacing.seven,
  },
  devSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  devMenu: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 250,
    paddingHorizontal: Spacing.two,
  },
  devRouteButton: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
});
