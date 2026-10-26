import { useEffect } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/shared/hooks/use-theme";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { createStyles } from "./sos-trigger-screen.styles";

export function SosTriggerScreen() {
  const colors = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ alertId?: string; statusChecked?: string }>();
  const user = useAuthStore((state) => state.user);
  const settingsReady = useSettingsStore((state) => state.isHydrated);
  const state = useSosStore();
  useSosStatus(state.ready, true, params.statusChecked !== "true");
  useEffect(() => {
    if (state.phase === "countdown") router.replace("/sos/countdown");
    else if (["submitting", "checking", "retry", "active", "ended"].includes(state.phase)) router.replace("/sos/active");
  }, [state.phase, router]);
  const disabled = !settingsReady || !state.ready || state.refreshing || !!state.error ||
    state.phase !== "idle" || state.contactsStatus !== "ready" || !state.contacts.length;
  const requestHelp = () => {
    const begin = () => void state.begin(typeof params.alertId === "string" ? params.alertId : undefined);
    if (useSettingsStore.getState().locationWithContacts) { begin(); return; }
    Alert.alert("Allow location sharing", "SOS requires sharing your phone's location with your emergency contacts.", [
      { text: "Cancel", style: "cancel" },
      { text: "Allow sharing", onPress: () => {
        useSettingsStore.getState().setLocationWithContacts(true);
        begin();
      } },
    ]);
  };
  return <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.sosSection}>
      <View style={styles.sosWrapper}>
        <View pointerEvents="none" style={styles.innerRing} />
        <Pressable disabled={disabled} onLongPress={requestHelp} delayLongPress={650}
          style={[styles.sosButton, disabled && styles.disabledButton]} accessibilityRole="button" accessibilityLabel="Request help for yourself"
          accessibilityHint="Press and hold to start a five-second countdown before texting your emergency contacts" accessibilityState={{ disabled }}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosHint}>Press and hold</Text>
        </Pressable>
      </View>
      <View style={styles.cancelHintBlock}>
        <Text style={styles.cancelHint}>
          You&apos;ll get <Text style={styles.emphasis}>5 seconds</Text> to cancel before your
        </Text>
        <Text style={styles.cancelHint}>contacts are texted.</Text>
      </View>
      {state.phase === "preparing" && <View><ActivityIndicator color={colors.accent} accessibilityLabel="Checking location permission" />
        <Text style={styles.contactsDescription}>Checking location permission…</Text></View>}
      {state.notice && <Text accessibilityLiveRegion="polite" style={styles.contactsDescription}>{state.notice}</Text>}
      {!user && <Text style={styles.contactsDescription}>Sign in to use SOS. Demo mode does not send messages.</Text>}
      {user && !state.ready && <Button title="Load SOS recovery" onPress={() => void state.setOwner(user.uid)} />}
      {state.error && <View accessibilityLiveRegion="polite"><Text style={styles.contactsDescription}>{state.error}</Text>
        <Button title="Check SOS status" onPress={() => void state.refresh()} isLoading={state.refreshing} /></View>}
    </View>
      <View style={styles.contactsSection}>
        <View style={styles.contactsHeader}>
          <Text style={styles.contactsTitle}>Emergency contacts</Text>
          <Pressable onPress={() => router.push("/contact")} hitSlop={8}
            accessibilityRole="link" accessibilityLabel="Manage emergency contacts">
            <Text style={styles.manageLink}>Manage</Text>
          </Pressable>
        </View>
        {state.contactsStatus === "loading" && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading emergency contacts" />}
        {state.contactsStatus === "error" && <><Text style={styles.contactsDescription}>Could not load your contacts.</Text>
          <Button title="Retry contacts" onPress={() => void state.loadContacts()} /></>}
        {state.contactsStatus === "ready" && state.contacts.length === 0 && <>
          <Text style={styles.contactsDescription}>Add an emergency contact before requesting help.</Text>
          <Button title="Add emergency contact" onPress={() => router.push("/contact/add-contact")} />
        </>}
        {state.contactsStatus === "ready" && state.contacts.length > 0 && <View style={styles.contactsSummary}>
          <View style={styles.avatars} accessibilityLabel={state.contacts.map((contact) => contact.name).join(", ")}>
            {state.contacts.slice(0, 3).map((contact, index) => <View key={contact.id}
              style={[styles.avatarFrame, index > 0 && styles.overlappingAvatar]}>
              {contact.profileImage ? <Image source={{ uri: contact.profileImage }} style={styles.avatar} /> :
                <View style={[styles.avatar, styles.initialAvatar, { backgroundColor: ["#E7EDFA", "#E5F2EC", "#F3EBE0"][index] }]}>
                  <Text style={[styles.initialText, { color: ["#0046CE", "#006C65", "#735332"][index] }]}>{contact.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
                </View>}
            </View>)}
          </View>
          <Text style={styles.contactsCount}>{state.contacts.length} {state.contacts.length === 1 ? "contact" : "contacts"} will be texted</Text>
        </View>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
