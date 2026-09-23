import AddIcon from "@/assets/icons/arrows-icons/cross-icon.svg";
import ContactIcon from "@/assets/icons/home-icons/filled-contact-icon.svg";
import { EmergencyContactList } from "@/components/contacts/emergency-contact-list";
import { NotificationSheet } from "@/components/ui/notification-sheet";
import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { EmergencyContact } from "@/types/emergency-contact";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ContactScreen() {
  const colors = useTheme();
  const router = useRouter();

  //  DEMO CONTACT DATA
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: "1",
      name: "Jovilyn Esquerra",
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
  ]);

  const handleAddContact = () => {
    router.push("/contact-pages/add-contact");
  };

  const handleContactPress = (contact: EmergencyContact) => {
    router.push({
      pathname: "/contact-pages/edit-contact",
      params: {
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
      },
    });
  };
  const { notification, message, updatedContact, deletedContactId } =
    useLocalSearchParams<{
      notification?: "success" | "error";
      message?: string;
      updatedContact?: string;
      deletedContactId?: string;
    }>();

  useEffect(() => {
    if (!updatedContact) return;

    try {
      const updated = JSON.parse(updatedContact) as EmergencyContact;

      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === updated.id ? updated : contact,
        ),
      );
    } catch (error) {
      console.error("FAILED TO PARSE UPDATED CONTACT:", error);
    }
  }, [updatedContact]);

  useEffect(() => {
    if (!deletedContactId) return;

    setContacts((currentContacts) =>
      currentContacts.filter((contact) => contact.id !== deletedContactId),
    );
  }, [deletedContactId]);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (notification && message) {
      setShowNotification(true);
    }
  }, [notification, message]);

  const handleNotificationHide = () => {
    setShowNotification(false);

    router.replace("/contact");
  };

  return (
    <PageLayout
      title="Emergency contacts"
      scrollable={false}
      contentFlush
      rightAction={
        <Pressable
          onPress={handleAddContact}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add emergency contact"
        >
          <AddIcon height={16} width={16} />
        </Pressable>
      }
    >
      <NotificationSheet
        visible={showNotification}
        message={message ?? ""}
        type={notification === "error" ? "error" : "success"}
        onHide={handleNotificationHide}
      />

      <View style={styles.contactContent}>
        {contacts.length === 0 ? (
          <EmptyContacts colors={colors} />
        ) : (
          <EmergencyContactList
            contacts={contacts}
            onContactPress={handleContactPress}
          />
        )}
      </View>
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
  contactContent: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    flex: 1,
  },
});
