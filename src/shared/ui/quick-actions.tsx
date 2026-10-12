import SosIcon from "@/assets/icons/home/echo-sos.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function QuickActions() {
  const router = useRouter();
  const colors = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            pressed && styles.actionPressed,
          ]}
          onPress={() => router.push("/sos" as any)}
          accessibilityRole="button"
          accessibilityLabel="Open SOS emergency screen"
        >
          <SosIcon width={15} height={15} />
          <Text style={[Typography.caption, styles.sosButtonText]}>SOS</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.contactsButton,
            { borderColor: colors.primary },
            pressed && styles.actionPressed,
          ]}
          onPress={() => router.push("/contact" as any)}
          accessibilityRole="button"
          accessibilityLabel="Open emergency contacts"
        >
          <ContactIcon width={13} height={16} />
          <Text style={[Typography.caption, { color: colors.primary }]}>
            Contacts
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionPressed: {
    opacity: 0.75,
  },
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  actions: {
    alignItems: "center",
    backgroundColor: "transparent",
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
  sosButtonText: {
    color: BrandColors.secondary,
  },
});
