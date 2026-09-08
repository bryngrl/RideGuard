import GreenCheckIcon from "@/assets/icons/green-check-icon.svg";
import LocationIcon from "@/assets/icons/location.svg";
import MainLogo from "@/assets/icons/main-logo.svg";
import NotificationIcon from "@/assets/icons/notification.svg";
import { Button } from "@/components/ui/button";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PermissionsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermissions = async () => {
    const location = await Location.getForegroundPermissionsAsync();
    const notifications = await Notifications.getPermissionsAsync();

    setLocationGranted(location.granted);
    setNotificationsGranted(notifications.granted);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleGoToSettings = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Request location first
      if (!locationGranted) {
        const result = await Location.requestForegroundPermissionsAsync();

        if (result.granted) {
          setLocationGranted(true);
        } else if (result.canAskAgain === false) {
          await Linking.openSettings();
        }

        return;
      }

      // Request notifications second
      if (!notificationsGranted) {
        const result = await Notifications.requestPermissionsAsync();

        if (result.granted) {
          setNotificationsGranted(true);
        } else if (result.canAskAgain === false) {
          await Linking.openSettings();
        }

        return;
      }

      // Both permissions granted
      router.replace("/provision");
    } catch (error) {
      console.error("Permission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonTitle = !locationGranted
    ? "Enable location"
    : !notificationsGranted
      ? "Enable notifications"
      : "Continue";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.container}>
        {/* MAIN CONTENT */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo width={64} height={64} />
          </View>

          <View style={styles.headerContainer}>
            <Text
              style={[
                Typography.largeTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Permissions
            </Text>

            <Text
              style={[
                Typography.body,
                {
                  color: theme.textMuted,
                  marginTop: Spacing.one,
                },
              ]}
            >
              We'll ask for a few things.
            </Text>
          </View>

          <View style={styles.permissionsList}>
            {/* LOCATION */}
            <View style={styles.permissionItem}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: theme.backgroundSelected,
                  },
                ]}
              >
                <LocationIcon width={16} height={16} />
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    Typography.h4,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Location
                </Text>

                <Text
                  style={[
                    Typography.bodySmall,
                    {
                      color: theme.textMuted,
                      marginTop: Spacing.two,
                    },
                  ]}
                >
                  To include your location in SOS texts.
                </Text>
              </View>

              {locationGranted && <GreenCheckIcon width={16} height={16} />}
            </View>

            {/* NOTIFICATIONS */}
            <View style={styles.permissionItem}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: theme.backgroundSelected,
                  },
                ]}
              >
                <NotificationIcon width={16} height={16} />
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    Typography.h4,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Notifications
                </Text>

                <Text
                  style={[
                    Typography.bodySmall,
                    {
                      color: theme.textMuted,
                      marginTop: Spacing.two,
                    },
                  ]}
                >
                  So alerts reach you the moment something's flagged.
                </Text>
              </View>

              {notificationsGranted && (
                <GreenCheckIcon width={16} height={16} />
              )}
            </View>
          </View>
        </View>

        {/* FIXED BOTTOM BUTTON */}
        <View style={styles.buttonContainer}>
          <Button
            title={buttonTitle}
            variant="primary"
            size="md"
            fullWidth
            onPress={handleGoToSettings}
            isLoading={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.four,
  },

  topSection: {
    flex: 1,
    paddingTop: Spacing.four,
  },

  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },

  logo: {
    width: 60,
    height: 60,
  },

  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },

  permissionsList: {
    gap: Spacing.four,
  },

  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.three,
  },

  permissionIcon: {
    width: 16,
    height: 16,
  },

  textContainer: {
    flex: 1,
  },

  checkIcon: {
    width: 16,
    height: 16,
    marginLeft: Spacing.three,
  },

  buttonContainer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
