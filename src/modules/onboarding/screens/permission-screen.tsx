import MainLogo from "@/assets/icons//logos/main.svg";
import LocationIcon from "@/assets/icons/actions/location.svg";
import NotificationIcon from "@/assets/icons/misc/notification.svg";
import GreenCheckIcon from "@/assets/icons/status/green-check.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { actionFooterPadding, Spacing, Typography } from "@/shared/theme";
import { Stepper } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { FormFeedback } from "@/shared/ui/form-feedback";
import * as Location from "expo-location";
import { getLocationAccess, openLocationSettings } from "@/shared/lib/location-access";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./permission-screen.styles";

export default function PermissionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const checkPermissions = async () => {
    const location = await getLocationAccess();
    const notifications = await Notifications.getPermissionsAsync();

    setLocationGranted(location.ready);
    setNotificationsGranted(notifications.granted);
  };

  useEffect(() => {
    void checkPermissions().catch(() => setPermissionError("Couldn't check permissions. Try again."));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkPermissions().catch(() => setPermissionError("Couldn't check permissions. Try again."));
      }
    });

    return () => subscription.remove();
  }, []);

  const handleGoToSettings = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setPermissionError(null);

    try {
      // Recheck the OS rather than relying on the last rendered checkmark.
      const location = await getLocationAccess();
      setLocationGranted(location.ready);
      if (!location.servicesEnabled) {
        await openLocationSettings();
        return;
      }
      if (!location.permission.granted) {
        const result = await Location.requestForegroundPermissionsAsync();

        if (result.granted) {
          setLocationGranted((await getLocationAccess()).ready);
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
      router.push("/(onboarding)/devices/camera");
    } catch (error) {
      setPermissionError("Couldn't update permissions. Check phone settings.");
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
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: actionFooterPadding(bottom, true) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={4} steps={10} size={4} />
        </View>
        {/* MAIN CONTENT */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo color={theme.logo} width={64} height={64} />
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
                <LocationIcon color={theme.icon} width={16} height={16} />
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

              {locationGranted && <GreenCheckIcon color={theme.success} width={16} height={16} />}
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
                <NotificationIcon color={theme.icon} width={16} height={16} />
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
                <GreenCheckIcon color={theme.success} width={16} height={16} />
              )}
            </View>
          </View>
        </View>

        {/* FIXED BOTTOM BUTTON */}
        <View style={styles.buttonContainer}>
          {permissionError ? <View style={{ width: "100%", marginBottom: Spacing.three }}><FormFeedback message={permissionError} /></View> : null}
          <View style={styles.actionsRow}>
          <Button title="Back" variant="ghost" fullWidth={false} feedbackEnabled={false}
            style={{ flex: 1, paddingHorizontal: 0, justifyContent: "flex-start" }}
            leftIcon={<BackArrowIcon color={theme.text} />} disabled={isLoading}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(onboarding)/register/emergency-contact")} />
          <Button
            title={buttonTitle}
            variant="primary"
            size="md"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={handleGoToSettings}
            isLoading={isLoading}
          />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
