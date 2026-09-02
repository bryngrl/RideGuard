import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

export default function PermissionsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleGoToSettings = () => {
    // nid pa logic idolo
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
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Go to settings"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleGoToSettings}
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
});
