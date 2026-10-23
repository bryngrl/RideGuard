import { Ionicons } from "@expo/vector-icons";
import { listContacts } from "@/modules/emergency-contacts/services/contacts.api";
import type { EmergencyContact } from "@/modules/emergency-contacts/types/emergency-contact.types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, View, useWindowDimensions } from "react-native";
import { styles } from "./sos-trigger-screen.styles";

export function SosTriggerScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isDemo = useAuthStore((state) => state.isDemo);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigating = useRef(false);

  useFocusEffect(useCallback(() => {
    navigating.current = false;
    if (isDemo) {
      setContacts([]);
      setLoading(false);
      setLoadError(false);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(false);
    listContacts().then((items) => {
      if (active) setContacts(items.slice(0, 5));
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isDemo, retryCount]));

  const handleSendSOS = () => {
    if (navigating.current) return;
    navigating.current = true;
    router.replace("/sos/countdown");
  };

  const contactMessage = loading
    ? "Loading emergency contacts…"
    : loadError
      ? "Emergency contacts could not be loaded."
      : contacts.length === 0
        ? "No emergency contacts added yet."
        : "Your emergency contacts are saved for SOS alerts";
  const contactGap = Math.min(128, Math.max(60, height * 0.146));
  const topOffset = Math.min(96, Math.max(0, (height - 650) * 0.45));

  return (
    <PageLayout title="SOS" scrollable={false} rightAction={
      <Pressable
        onPress={() => Alert.alert("SOS", "Press and hold the circle to start the SOS countdown. Slide left to cancel before it ends.")}
        accessibilityRole="button"
        accessibilityLabel="SOS help"
        feedbackRadius={20}
        style={styles.helpButton}
      >
        <Ionicons name="help-circle-outline" size={23} color={BrandColors.primary} />
      </Pressable>
    }>
      <View style={styles.container}>
        <View style={[styles.sosSection, { paddingTop: topOffset }]}>
          <View style={styles.sosRing}>
            <Pressable
              feedbackRadius={9999}
              feedbackColor={BrandColors.secondary}
              onLongPress={handleSendSOS}
              delayLongPress={1200}
              style={styles.sosButton}
              accessibilityRole="button"
              accessibilityLabel="Press and hold to send SOS emergency alert"
              accessibilityHint="Hold for a little over one second to start the SOS countdown"
              accessibilityActions={[{ name: "activate", label: "Start SOS countdown" }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === "activate") handleSendSOS();
              }}
            >
              <Text style={[Typography.button, styles.sosText]}>Press and hold{"\n"}to send SOS</Text>
              <Text style={styles.sosHint}>Hold briefly</Text>
            </Pressable>
          </View>

          <View style={[styles.contactsSection, { marginTop: contactGap }]}>
            {loading ? <ActivityIndicator color={BrandColors.primary} style={styles.loading} /> : null}
            {!loading && !loadError && contacts.length > 0 ? (
              <View style={styles.avatars}>
                {contacts.map((contact, index) => (
                  <View key={contact.id} style={[styles.avatar, index > 0 && styles.overlappingAvatar]}>
                    {contact.profileImage ? (
                      <Image source={{ uri: contact.profileImage }} style={styles.avatarImage} onError={() => {
                        setContacts((current) => current.map((item) => item.id === contact.id ? { ...item, profileImage: undefined } : item));
                      }} />
                    ) : (
                      <Text style={styles.initialText}>{contact.name.trim().charAt(0).toUpperCase() || "?"}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={[Typography.bodySmall, styles.contactsDescription]}>{contactMessage}</Text>
            {!loading && loadError ? (
              <Pressable onPress={() => setRetryCount((count) => count + 1)} accessibilityRole="button" style={styles.contactsLink}>
                <Text style={styles.contactsLinkText}>Retry loading contacts</Text>
              </Pressable>
            ) : null}
            {!loading && !loadError && contacts.length === 0 ? (
              <Pressable onPress={() => router.push("/contact")} accessibilityRole="button" style={styles.contactsLink}>
                <Text style={styles.contactsLinkText}>Add emergency contacts</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
