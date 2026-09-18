import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ContactIcon from "@/assets/icons/home-icons/filled-contact-icon.svg";
import { EmergencyContactList } from "@/components/contacts/emergency-contact-list";
import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { EmergencyContact } from "@/types/emergency-contact";

export default function ContactScreen() {
  const colors = useTheme();
  const router = useRouter();

  // TODO: Replace with backend API Function
  const contacts: EmergencyContact[] = [
    {
      id: "1",
      name: "Name",
      phoneNumber: "0912 345 6789",
    },
    {
      id: "2",
      name: "Name",
      phoneNumber: "0912 345 6789",
    },
    {
      id: "3",
      name: "Name",
      phoneNumber: "0912 345 6789",
    },
    {
      id: "4",
      name: "Name",
      phoneNumber: "0912 345 6789",
    },
  ];

  const handleAddContact = () => {
    router.push("/contact-pages/add-contact");
  };

  return (
    <PageLayout
      title="Emergency contacts"
      scrollable={false}
      rightAction={
        <Pressable
          onPress={handleAddContact}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add emergency contact"
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </Pressable>
      }
    >
      {contacts.length === 0 ? (
        <EmptyContacts colors={colors} />
      ) : (
        <EmergencyContactList contacts={contacts} />
      )}
    </PageLayout>
  );
}

function EmptyContacts({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.backgroundSelected,
          },
        ]}
      >
        <ContactIcon width={30} height={38} />
      </View>

      <Text
        style={[
          Typography.h3,
          styles.title,
          {
            color: colors.text,
          },
        ]}
      >
        No emergency contacts yet
      </Text>

      <Text
        style={[
          Typography.body,
          styles.description,
          {
            color: colors.textMuted,
          },
        ]}
      >
        Add trusted contacts during setup so they can be notified when you send
        an SOS alert.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
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
