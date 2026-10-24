import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { Button } from "@/shared/ui/button";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, View, useWindowDimensions } from "react-native";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { useSosStore } from "../store/sos.store";
import { styles } from "./sos-trigger-screen.styles";

export function SosTriggerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alertId?: string }>();
  const { height } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const settingsReady = useSettingsStore((state) => state.isHydrated);
  const shareLocation = useSettingsStore((state) => state.locationWithContacts);
  const state = useSosStore();
  const [failedImages, setFailedImages] = useState<string[]>([]);
  useSosStatus(state.ready, true);

  useEffect(() => {
    if (state.phase === "countdown") router.replace("/sos/countdown");
    else if (["submitting", "checking", "retry", "active", "ended"].includes(state.phase)) router.replace("/sos/active");
  }, [state.phase, router]);

  const disabled = !settingsReady || !state.ready || state.refreshing || !!state.error ||
    state.phase !== "idle" || state.contactsStatus !== "ready" || !state.contacts.length;

  const handleSendSOS = () => {
    if (!disabled) void state.begin(typeof params.alertId === "string" ? params.alertId : undefined);
  };

  const contactMessage = !user
    ? "Sign in to use SOS. Demo mode does not send messages."
    : state.contactsStatus === "loading"
      ? "Loading emergency contacts…"
      : state.contactsStatus === "error"
        ? "Emergency contacts could not be loaded."
        : state.contacts.length === 0
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
              disabled={disabled}
              style={[styles.sosButton, disabled && { opacity: 0.5 }]}
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
            {state.contactsStatus === "loading" || state.phase === "preparing" ?
              <ActivityIndicator color={BrandColors.primary} style={styles.loading} /> : null}
            {state.contactsStatus === "ready" && state.contacts.length > 0 ? (
              <View style={styles.avatars}>
                {state.contacts.slice(0, 5).map((contact, index) => (
                  <View key={contact.id} style={[styles.avatar, index > 0 && styles.overlappingAvatar]}>
                    {contact.profileImage && !failedImages.includes(contact.id) ? (
                      <Image source={{ uri: contact.profileImage }} style={styles.avatarImage} onError={() => {
                        setFailedImages((current) => [...current, contact.id]);
                      }} />
                    ) : (
                      <Text style={styles.initialText}>{contact.name.trim().charAt(0).toUpperCase() || "?"}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={[Typography.bodySmall, styles.contactsDescription]}>{contactMessage}</Text>
            {state.contactsStatus === "error" ? (
              <Pressable onPress={() => void state.loadContacts()} accessibilityRole="button" style={styles.contactsLink}>
                <Text style={styles.contactsLinkText}>Retry loading contacts</Text>
              </Pressable>
            ) : null}
            {state.contactsStatus === "ready" && state.contacts.length === 0 ? (
              <Pressable onPress={() => router.push("/contact/add-contact")} accessibilityRole="button" style={styles.contactsLink}>
                <Text style={styles.contactsLinkText}>Add emergency contacts</Text>
              </Pressable>
            ) : null}
            {user && !state.ready ? <Button title="Load SOS recovery" onPress={() => void state.setOwner(user.uid)} /> : null}
            {state.error ? <View accessibilityLiveRegion="polite" style={styles.previewPanel}>
              <Text style={styles.contactsDescription}>{state.error}</Text>
              <Button title="Check SOS status" onPress={() => void state.refresh()} isLoading={state.refreshing} />
            </View> : null}
            {user && state.contactsStatus === "ready" && state.contacts.length > 0 ?
              <Text style={[Typography.bodySmall, styles.contactsDescription]}>
                {shareLocation ? "Your phone's location will be included when available." : "Your location will not be shared."}
              </Text> : null}
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
