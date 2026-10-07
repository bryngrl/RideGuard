import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, KeyboardAvoidingWrapper } from "@/shared/ui";
import { Href, useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";

// 1. Raw layout array parsed directly from your terminal output
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

// 2. Automated routing cleaner function to fix Windows slashes and remove structural noise
const getCleanRoutes = () => {
  const uniqueRoutes = new Set<string>();

  RAW_ROUTES.forEach((route) => {
    // Convert all Windows backslashes into standard web forward slashes
    let clean = route.replace(/\\/g, "/");

    // Remove route group parentheses like /(tabs)/
    clean = clean.replace(/\/\([^)]+\)/g, "");

    // Clean duplicate end paths (e.g., /privacy/privacy -> /privacy)
    const segments = clean.split("/").filter(Boolean);
    if (segments.length === 2 && segments[0] === segments[1]) {
      clean = `/${segments[0]}`;
    }

    // Eliminate index files (e.g., /devices/index -> /devices)
    if (clean.endsWith("/index")) {
      clean = clean.substring(0, clean.length - 6);
    }

    // Standardize root paths
    if (!clean.startsWith("/")) {
      clean = `/${clean}`;
    }
    if (clean === "") {
      clean = "/";
    }

    // Skip utility routes or dynamic parameter definitions that lack explicit values
    if (clean.includes("[") || clean === "/_sitemap") return;

    uniqueRoutes.add(clean);
  });

  return Array.from(uniqueRoutes);
};

export function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [showDevMenu, setShowDevMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
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

  const cleanRoutes = getCleanRoutes();

  return (
    <KeyboardAvoidingWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[Typography.h1, { color: colors.text }]}>Settings</Text>
          <View style={styles.logout}>
            <Button
              title="Log out"
              variant="danger"
              size="md"
              fullWidth
              onPress={handleLogout}
            />
          </View>

          {/* 3. Dev-only Section with Automated Tap-To-Visit List */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <Pressable onPress={() => setShowDevMenu(!showDevMenu)}>
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
                >
                  {cleanRoutes.map((route) => (
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
        <BottomNavigation />
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  logout: {
    alignContent: "center",
    marginBottom: Spacing.four,
  },
  devSection: {
    marginTop: Spacing.two,
    flex: 1,
  },
  devMenu: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 300,
    padding: Spacing.two,
  },
  devRouteButton: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
});
