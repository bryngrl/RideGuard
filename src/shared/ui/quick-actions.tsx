import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import SosIcon from "@/assets/icons/home/echo-sos.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function QuickActions({ homeLayout = false }: { homeLayout?: boolean }) {
  const router = useRouter();
  const colors = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.actions}>
        <Pressable
          feedbackRadius={BorderRadius.full}
          feedbackColor={BrandColors.secondary}
          style={[
            styles.sosButton,
            homeLayout && styles.homeSosButton,
          ]}
          onPress={() => router.push("/sos" as any)}
          accessibilityRole="button"
          accessibilityLabel="Open SOS emergency screen"
        >
          <SosIcon width={homeLayout ? 22 : 15} height={homeLayout ? 22 : 15} />
          <Text style={[Typography.button, styles.sosButtonText]}>SOS</Text>
        </Pressable>
        {!homeLayout && (
          <Pressable
            feedbackRadius={BorderRadius.full}
            style={[styles.contactsButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/contact" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open emergency contacts"
          >
            <ContactIcon width={13} height={16} />
            <Text style={[Typography.button, { color: colors.primary }]}>Contacts</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  contactsButton: {
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  sosButton: {
    alignItems: "center",
    backgroundColor: BrandColors.error,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  homeSosButton: {
    minHeight: 56,
    width: "100%",
    gap: Spacing.two,
  },
  sosButtonText: {
    color: BrandColors.secondary,
  },
});
