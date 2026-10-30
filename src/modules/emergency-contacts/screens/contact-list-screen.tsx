import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import AddIcon from "@/assets/icons/arrows/cross.svg";
import ProfilePlaceholder from "@/assets/icons/misc/profile-placeholder.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { PageLayout } from "@/shared/ui/page-layout";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useLoadingCountsStore } from "@/shared/store/loading-counts.store";
import { EmergencyContactList } from "../components/emergency-contact-list";
import { ContactsSkeleton } from "../components/contacts-skeleton";
import { getCachedContacts, listContacts } from "../services/contacts.api";
import type { EmergencyContact } from "../types/emergency-contact.types";
import { styles } from "./contact-list-screen.styles";

export function ContactListScreen() {
  const colors = useTheme();
  const router = useRouter();

  const isDemo = useAuthStore((state) => state.isDemo);
  const uid = useAuthStore((state) => state.user?.uid);
  const loadingCount = useLoadingCountsStore((state) => uid ? state.counts[uid]?.contacts : undefined);
  const [contacts, setContacts] = useState<EmergencyContact[]>(getCachedContacts);
  const [loading, setLoading] = useState(!isDemo);
  const [hasLoaded, setHasLoaded] = useState(isDemo);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigatingRef = useRef(false);

  useFocusEffect(useCallback(() => {
    navigatingRef.current = false;
    if (isDemo) {
      setHasLoaded(true);
      setLoading(false);
      return;
    }
    let active = true;
    const saved = getCachedContacts();
    if (saved.length) { setContacts(saved); setHasLoaded(true); }
    setLoading(true);
    setLoadError(null);
    listContacts({ force: retryCount > 0 }).then((items) => {
      if (active) {
        setContacts(items);
        setHasLoaded(true);
      }
    }).catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Unable to load contacts.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isDemo, retryCount]));

  const handleAddContact = () => {
    if (navigatingRef.current || loading || !hasLoaded || contacts.length >= 5) return;
    navigatingRef.current = true;
    router.push("/contact/add-contact" as any);
  };

  const handleContactPress = (contact: EmergencyContact) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push({
      pathname: "/contact/edit-contact" as any,
      params: {
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email,
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
    router.setParams({ notification: undefined, message: undefined });
  };

  return (
    <PageLayout
      title="Emergency contacts"
      scrollable={false}
      contentFlush
      overlay={
        <NotificationSheet
          visible={showNotification}
          message={message ?? ""}
          type={notification === "error" ? "error" : "success"}
          onHide={handleNotificationHide}
        />
      }
      rightAction={contacts.length < 5 ? (
        <Pressable
          onPress={handleAddContact}
          feedbackRadius={8}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add emergency contact"
          disabled={loading || !hasLoaded}
        >
          <AddIcon color={colors.icon} height={16} width={16} />
        </Pressable>
      ) : null}
    >
      <View style={styles.contactContent}>
        {loadError ? (
          <View style={styles.errorState}>
            <Text accessibilityRole="alert" style={{ color: colors.error }}>{loadError}</Text>
            <Pressable accessibilityRole="button" onPress={() => setRetryCount((count) => count + 1)} feedbackRadius={9999}>
              <Text style={{ color: colors.primary, marginTop: 12 }}>Try again</Text>
            </Pressable>
          </View>
        ) : loading && contacts.length === 0 ? (
          <ContactsSkeleton count={loadingCount} />
        ) : contacts.length === 0 ? (
          <EmptyContacts colors={colors} onAdd={handleAddContact} />
        ) : (
          <>
            {contacts.length >= 5 ? (
              <Text style={[Typography.bodySmall, styles.limitMessage, { color: colors.textMuted }]}>
                Five-contact limit reached. Edit or remove a contact to add another.
              </Text>
            ) : null}
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
              <EmergencyContactList contacts={contacts} onContactPress={handleContactPress} />
            </ScrollView>
          </>
        )}
      </View>
    </PageLayout>
  );
}

function EmptyContacts({ colors, onAdd }: { colors: ReturnType<typeof useTheme>; onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <ProfilePlaceholder color={colors.contactIllustration} width={112} height={112} />

      <Text
        style={[
          Typography.h3,
          styles.title,
          { color: colors.textMuted },
        ]}
      >
        No contacts
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
        Contacts you've added will appear here.
      </Text>
      <Pressable
        onPress={onAdd}
        style={styles.emptyAction}
        feedbackRadius={10}
        accessibilityRole="button"
        accessibilityLabel="Add new contact"
      >
        <Text style={[Typography.medium, { color: colors.accent }]}>Add new contact</Text>
      </Pressable>
    </View>
  );
}
