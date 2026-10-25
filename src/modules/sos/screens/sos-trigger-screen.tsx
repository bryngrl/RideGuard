import { useEffect } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { Button } from "@/shared/ui/button";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { styles } from "./sos-trigger-screen.styles";

export function SosTriggerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alertId?: string }>();
  const user = useAuthStore((state) => state.user);
  const settingsReady = useSettingsStore((state) => state.isHydrated);
  const shareLocation = useSettingsStore((state) => state.locationWithContacts);
  const state = useSosStore();
  useSosStatus(state.ready, true);
  useEffect(() => {
    if (state.phase === "countdown") router.replace("/sos/countdown");
    else if (["submitting", "checking", "retry", "active", "ended"].includes(state.phase)) router.replace("/sos/active");
  }, [state.phase, router]);
  const disabled = !settingsReady || !state.ready || state.refreshing || !!state.error ||
    state.phase !== "idle" || state.contactsStatus !== "ready" || !state.contacts.length;
  return <PageLayout title="SOS" contentStyle={{ gap: 20 }}>
    <View style={styles.sosSection}>
      <View style={styles.sosWrapper}>
        <Pressable disabled={disabled} onPress={() => void state.begin(typeof params.alertId === "string" ? params.alertId : undefined)}
          style={[styles.sosButton, disabled && { opacity: 0.5 }]} accessibilityRole="button" accessibilityLabel="Request help for yourself">
          <Text style={[Typography.button, styles.sosText]}>Tap to{"\n"}request help</Text>
          <Text style={[Typography.caption, styles.sosHint]}>Five seconds to cancel</Text>
        </Pressable>
      </View>
      <Text style={[Typography.body, styles.contactsDescription]}>
        Request help for yourself.{"\n"}{shareLocation ? "Your phone's location snapshot will be included when available." : "Your location will not be shared."}
      </Text>
      {state.phase === "preparing" && <View><ActivityIndicator accessibilityLabel="Checking location permission" />
        <Text style={styles.contactsDescription}>Checking location permission…</Text></View>}
      {state.refreshing && <Text style={styles.contactsDescription}>Checking SOS status…</Text>}
      {state.notice && <Text accessibilityLiveRegion="polite" style={styles.contactsDescription}>{state.notice}</Text>}
      {!user && <Text style={styles.contactsDescription}>Sign in to use SOS. Demo mode does not send messages.</Text>}
      {user && !state.ready && <Button title="Load SOS recovery" onPress={() => void state.setOwner(user.uid)} />}
      {state.error && <View accessibilityLiveRegion="polite"><Text style={styles.contactsDescription}>{state.error}</Text>
        <Button title="Check SOS status" onPress={() => void state.refresh()} isLoading={state.refreshing} /></View>}
      <View style={styles.contactsSection}>
        {state.contactsStatus === "loading" && <ActivityIndicator accessibilityLabel="Loading emergency contacts" />}
        {state.contactsStatus === "error" && <><Text style={styles.contactsDescription}>Could not load your contacts.</Text>
          <Button title="Retry contacts" onPress={() => void state.loadContacts()} /></>}
        {state.contactsStatus === "ready" && state.contacts.length === 0 && <>
          <Text style={styles.contactsDescription}>Add an emergency contact before requesting help.</Text>
          <Button title="Add emergency contact" onPress={() => router.push("/contact/add-contact")} />
        </>}
        {state.contacts.map((contact) => <View key={contact.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {contact.profileImage ? <Image source={{ uri: contact.profileImage }} style={styles.avatar} /> :
            <View style={[styles.avatar, styles.initialAvatar]}><Text style={styles.initialText}>{contact.name.slice(0, 1).toUpperCase()}</Text></View>}
          <Text style={[Typography.bodySmall, { color: BrandColors.primary }]}>{contact.name}</Text>
        </View>)}
      </View>
    </View>
  </PageLayout>;
}
