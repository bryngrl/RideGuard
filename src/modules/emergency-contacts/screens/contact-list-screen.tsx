import AddIcon from "@/assets/icons/arrows/cross.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { PageLayout } from "@/shared/ui/page-layout";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { EmergencyContactList } from "../components/emergency-contact-list";
import { listContacts } from "../services/contacts.api";
import type { EmergencyContact } from "../types/emergency-contact.types";
import { styles } from "./contact-list-screen.styles";

export function ContactListScreen() {
  const colors = useTheme();
  const router = useRouter();

  const isDemo = useAuthStore((state) => state.isDemo);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(useCallback(() => {
    if (isDemo) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    listContacts().then((items) => {
      if (active) setContacts(items);
    }).catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Unable to load contacts.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isDemo, retryCount]));

  const handleAddContact = () => {
    router.push("/contact/add-contact" as any);
  };

  const handleContactPress = (contact: EmergencyContact) => {
    router.push({
      pathname: "/contact/edit-contact" as any,
      params: {
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
          relationship: contact.relationship ?? "",
          profileImage: contact.profileImage ?? "",
      },
    });
  };

  const { notification, message } =
    useLocalSearchParams<{
      notification?: "success" | "error";
      message?: string;
    }>();

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (notification && message) {
      setShowNotification(true);
    }
  }, [notification, message]);

  const handleNotificationHide = () => {
    setShowNotification(false);

    router.replace("/contact" as any);
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
        {loading ? (
          <Text style={{ color: colors.textMuted, padding: 24 }}>Loading contacts...</Text>
        ) : loadError ? (
          <View style={{ padding: 24 }}>
            <Text accessibilityRole="alert" style={{ color: colors.error }}>{loadError}</Text>
            <Pressable accessibilityRole="button" onPress={() => setRetryCount((count) => count + 1)}>
              <Text style={{ color: colors.primary, marginTop: 12 }}>Try again</Text>
            </Pressable>
          </View>
        ) : contacts.length === 0 ? (
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
