import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Image, Linking, StyleSheet, Text, View } from "react-native";

export default function PermissionsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we alr have a permission
  const checkPermissions = async () => {
    const location = await Location.getForegroundPermissionsAsync();
    const notifications = await Notifications.getPermissionsAsync();

    setLocationGranted(location.granted);
    setNotificationsGranted(notifications.granted);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  // check if the user returns from setting
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleGoToSettings = () => {
    const handleGoToSettings = async () => {
      if (isLoading) return;

      setIsLoading(true);

      try {
        // Location
        if (!locationGranted) {
          const result = await Location.requestForegroundPermissionsAsync();

          if (result.granted) {
            setLocationGranted(true);
          } else if (result.canAskAgain === false) {
            await Linking.openSettings();
          }

          return;
        }
        // Notifications
        if (!notificationsGranted) {
          const result = await Notifications.requestPermissionsAsync();

          if (result.granted) {
            setNotificationsGranted(true);
          } else if (result.canAskAgain === false) {
            await Linking.openSettings();
          }

          return;
        }

        // redirection to provision token
        router.replace("/(tabs)");
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Primary-Icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Permissions
            </Text>
            <Text
              style={[
                Typography.body,
                { color: theme.textMuted, marginTop: Spacing.one },
              ]}
            >
              We'll ask for a few things.
            </Text>
          </View>

          <View style={styles.permissionsList}>
            {/* location*/}
            <View style={styles.permissionItem}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <Image
                  source={require("@/assets/icons/location-icon.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[Typography.h4, { color: theme.text }]}>
                  Location
                </Text>

                <Text
                  style={[
                    Typography.bodySmall,
                    { color: theme.textMuted, marginTop: Spacing.two },
                  ]}
                >
                  To include your location in SOS texts.
                </Text>
              </View>
              {/* palitan ng check icon */}
              {locationGranted && (
                <Image
                  source={require("@/assets/icons/notification-icon.png")}
                  style={styles.checkIcon}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* notifs */}
            <View style={styles.permissionItem}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <Image
                  source={require("@/assets/icons/notification-icon.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[Typography.h4, { color: theme.text }]}>
                  Notifications
                </Text>

                <Text
                  style={[
                    Typography.bodySmall,
                    { color: theme.textMuted, marginTop: Spacing.two },
                  ]}
                >
                  So alerts reach you the moment something's flagged.
                </Text>
              </View>

              {/* Palitan ng icon */}
              {notificationsGranted && (
                <Image
                  source={require("@/assets/icons/notification-icon.png")}
                  style={styles.checkIcon}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title={
              !locationGranted
                ? "Enable location"
                : !notificationsGranted
                  ? "Enable notifications"
                  : "Continue"
            }
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleGoToSettings}
            isLoading={isLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
    paddingTop: 72,
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.three,
  },
  textContainer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.two,
  },
  checkIcon: {
    width: 24,
    height: 24,
    marginLeft: Spacing.three,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
