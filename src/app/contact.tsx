// TODO: Functional Component for Adding Contacts
import ContactIcon from "@/assets/icons/home-icons/filled-contact-icon.svg";
import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, Text, View } from "react-native";

export default function ContactScreen() {
  const colors = useTheme();

  return (
    <PageLayout title="Emergency contacts" scrollable={false}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSelected }]}>
          <ContactIcon width={30} height={38} />
        </View>
        <Text style={[Typography.h3, styles.title, { color: colors.text }]}>No emergency contacts yet</Text>
        <Text style={[Typography.body, styles.description, { color: colors.textMuted }]}>
          Add trusted contacts during setup so they can be notified when you send an SOS alert.
        </Text>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Spacing.seven,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
  },
  title: {
    marginTop: Spacing.three,
    textAlign: "center",
  },
  description: {
    maxWidth: 280,
    marginTop: Spacing.two,
    textAlign: "center",
  },
});
