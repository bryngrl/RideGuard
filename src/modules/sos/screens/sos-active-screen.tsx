import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { actionFooterPadding, BrandColors, Typography } from "@/shared/theme";
import { useTheme } from "@/shared/hooks/use-theme";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { ageLabel, messagePresentation, type SosRecord, type Submission } from "../types";
import { createStyles } from "./sos-active-screen.styles";

function MessageRow({ label, value, now, color }: { label: string; value: Submission; now: number; color: string }) {
  const presentation = messagePresentation(value, now);
  return <View style={{ gap: 4 }}>
    <Text style={[Typography.bodySmall, { color }]}>{label}</Text>
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${label}: ${presentation.label}. ${presentation.detail}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={presentation.icon} size={22} color={color} accessible={false} />
      <Text style={[Typography.button, { color, flexShrink: 1 }]}>{presentation.label}</Text>
    </View>
    <Text style={[Typography.bodySmall, { color }]}>{presentation.detail}</Text>
    <Text style={[Typography.bodySmall, { color }]}>{value.delivery?.lastCheckedAt
      ? `Delivery checked ${ageLabel(value.delivery.lastCheckedAt, now)}` : "Not checked yet"}</Text>
  </View>;
}

function ContactCard({ recipient, now, compact = false }: { recipient: SosRecord["recipients"][number]; now: number; compact?: boolean }) {
  const colors = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const presentation = messagePresentation(recipient.initial, now);
  const tones = {
    Delivered: { text: colors.success, badge: `${colors.success}18`, bar: colors.success, steps: 3 },
    Sent: { text: colors.accent, badge: colors.infoBackground, bar: colors.accent, steps: 2 },
    Submitted: { text: compact ? colors.text : colors.accent, badge: compact ? colors.backgroundSelected : colors.infoBackground, bar: colors.accent, steps: 1 },
  };
  const failed = presentation.label === "Failed";
  const tone = tones[presentation.label as keyof typeof tones] ?? {
    text: failed ? colors.error : colors.textMuted,
    badge: failed ? colors.errorBackground : colors.backgroundSelected,
    bar: failed ? colors.error : colors.textMuted, steps: 0,
  };
  const initials = recipient.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
  const maskedPhone = recipient.phone.replace(/\d(?=(?:\D*\d){3})/g, (digit, offset: number) => offset < 5 ? digit : "•");
  const submittedAt = new Date(recipient.initial.delivery?.acceptedAt ?? recipient.initial.updatedAt)
    .toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  return <View style={compact ? styles.endedContact : styles.contactCard}>
    <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button"
      accessibilityLabel={`${recipient.name}: ${presentation.label}. ${presentation.detail}`}
      accessibilityHint="Show or hide message details" accessibilityState={{ expanded }} style={[styles.contactHeader, compact && styles.endedContactHeader]}>
      <View style={[styles.avatar, compact && styles.endedAvatar]}>
        <Text style={[styles.initials, compact && styles.endedInitials]}>{initials}</Text>
      </View>
      <View style={styles.contactIdentity}>
        <Text style={[styles.contactName, compact && styles.endedContactName]} numberOfLines={1}>{recipient.name}</Text>
        {!compact && <Text style={styles.phone} numberOfLines={1}>{maskedPhone}</Text>}
      </View>
      <View style={[styles.statusBadge, compact && styles.endedStatusBadge, { backgroundColor: tone.badge }]}>
        <Text accessibilityLiveRegion="polite" style={[styles.statusText, compact && styles.endedStatusText, { color: tone.text }]}>{presentation.label}</Text>
      </View>
    </Pressable>
    {!compact && <View style={styles.progressTrack} accessible accessibilityLabel={`SOS message: ${presentation.label}. ${presentation.detail}`}>
      {["Submitted", "Sent", "Delivered"].map((label, index) => <View key={label} style={styles.progressStep}>
        <View style={[styles.progressSegment, { backgroundColor: index < tone.steps ? tone.bar : colors.border }]} />
        <Text style={[styles.progressLabel, index === tone.steps - 1 && { color: tone.text }]}>
          {label}{index === 0 && tone.steps > 0 ? ` ${submittedAt}` : ""}
        </Text>
      </View>)}
    </View>}
    {failed && <Text style={[Typography.bodySmall, { color: colors.error }]}>{presentation.detail}</Text>}
    {recipient.initial.status === "unknown" && <Text style={[Typography.bodySmall, { color: colors.text }]}>{presentation.detail}</Text>}
    {recipient.ended && (!compact || expanded) && <MessageRow label="SOS ended message" value={recipient.ended} now={now} color={colors.text} />}
    {expanded && <View style={styles.contactDetails}>
      <Text selectable style={[Typography.bodySmall, { color: colors.text }]}>{recipient.phone}</Text>
      <MessageRow label="SOS message" value={recipient.initial} now={now} color={colors.text} />
    </View>}
  </View>;
}

export function SosActiveScreen() {
  const { bottom } = useSafeAreaInsets();
  const colors = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const state = useSosStore();
  useSosStatus(state.ready, true);
  const record = state.record;
  const [now, setNow] = useState(Date.now());
  const [manualRefreshing, setManualRefreshing] = useState(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const title = record?.status === "active" ? "SOS active" : record?.status === "ended" ? "SOS ended by you" :
    state.phase === "submitting" ? "Requesting help" : state.phase === "checking" ? "Checking SOS status" : "SOS not confirmed";
  const cooldown = record?.statusRefresh?.nextAllowedAt ? Date.parse(record.statusRefresh.nextAllowedAt) - now : 0;
  const refreshing = manualRefreshing || record?.statusRefresh?.state === "pending" && Date.parse(record.statusRefresh.expiresAt ?? "") > now;
  const refreshStatus = async () => {
    setManualRefreshing(true);
    try { await state.refreshStatus(); }
    finally { setManualRefreshing(false); }
  };
  const done = async () => {
    await state.dismissEnded();
    router.replace("/");
  };
  const locationIncluded = !!record?.location && !record.recipients.some(r => r.initial.errorCode === "location_omitted_message_limit");
  const refreshDisabled = !!refreshing || cooldown > 0 || state.phase === "submitting";
  if (record?.status === "ended") return <SafeAreaView style={styles.endedContainer} edges={["top", "bottom"]}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.endedContent}>
      <View style={styles.endedHeading}>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.endedTitle}>SOS ended</Text>
        <Text style={styles.endedSubtitle}>We're texting your contacts once to let them know your SOS has ended.</Text>
      </View>
      {record.recipients.length > 0 && <View style={styles.endedStatusSection}>
        <Text accessibilityRole="header" style={styles.endedSectionTitle}>SMS STATUS</Text>
        <View style={styles.endedContacts}>
          {record.recipients.map((recipient, index) => <View key={recipient.contactId}
            style={index > 0 ? styles.endedContactDivider : undefined}>
            <ContactCard recipient={recipient} now={now} compact />
          </View>)}
        </View>
      </View>}
      <View style={styles.endedNote}>
        <Ionicons name="time-outline" size={18} color={colors.accent} />
        <Text style={styles.endedNoteText}>Statuses update for up to 5 minutes. Tap Done to dismiss this SOS and start again.</Text>
      </View>
      {state.error && <View style={styles.endedDetails}>
        <Text accessibilityLiveRegion="polite" style={styles.endedNoteText}>{state.error}</Text>
        <Button title="Retry status" variant="secondary" isLoading={state.refreshing} onPress={() => void state.refreshStatus()} />
      </View>}
      {state.notice && <Text style={styles.endedNoteText}>{state.notice}</Text>}
    </ScrollView>
    <View style={[styles.endedFooter, { paddingBottom: actionFooterPadding(bottom, true) }]}>
      <Button title="Done" onPress={() => void done()} style={styles.doneButton} />
    </View>
  </SafeAreaView>;
  return <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
    <View style={styles.header}>
      <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back"
        onPress={() => router.canGoBack() ? router.back() : router.replace("/sos")}>
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>
      <View style={styles.headerTitle}>
        <View style={styles.activeDotHalo}><View style={styles.activeDot} /></View>
        <Text accessibilityLiveRegion="polite" style={styles.title}>{title.toUpperCase()}</Text>
      </View>
      <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="SOS preferences"
        onPress={() => router.push("/settings/sos-preferences")}>
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <View style={styles.statusBar}>
        <View style={styles.locationBadge} accessible accessibilityLabel={locationIncluded ? "Location snapshot included. This is not live tracking." : "Location not included"}>
          <MaterialCommunityIcons name={locationIncluded ? "map-marker-outline" : "map-marker-off-outline"} size={16} color="#FFFFFF" />
          <Text style={styles.locationText}>{locationIncluded ? "Location included" : "Location not included"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh message status"
          accessibilityState={{ disabled: refreshDisabled || state.refreshing }} disabled={refreshDisabled || state.refreshing}
          onPress={() => void refreshStatus()} style={[styles.refreshButton, refreshDisabled && styles.disabled]}>
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.locationText}>{refreshing ? "Checking" : cooldown > 0 ? `${Math.ceil(cooldown / 1000)}s` : "Refresh"}</Text>
        </Pressable>
      </View>
      {record?.status !== "active" && <Text style={[Typography.body, styles.description]}>
        Do not assume contacts were notified. You can contact them directly while checking status.
      </Text>}
      {state.error && <Text accessibilityLiveRegion="polite" style={[Typography.body, styles.description]}>{state.error}</Text>}
      {state.error && <Button title="Retry status" variant="secondary" isLoading={state.refreshing} onPress={() => void state.refreshStatus()} />}
      {state.notice && <Text style={[Typography.bodySmall, styles.description]}>{state.notice}</Text>}
      {state.phase === "retry" && <Button title="Retry the same SOS request" variant="secondary" onPress={() => void state.retry()} />}
      {record && <>
        <View style={styles.contactsList}>
          {record.recipients.map((recipient) => <ContactCard key={recipient.contactId} recipient={recipient} now={now} />)}
        </View>
        {record.recipients.some((r) => r.initial.status === "unknown" || r.ended?.status === "unknown") &&
          <Text style={[Typography.bodySmall, styles.description]}>An unknown submission may have reached the contact. It will not be resent automatically.</Text>}
      </>}
      {!record && <View style={{ gap: 8 }}><Text style={[Typography.button, { color: BrandColors.secondary }]}>Contact someone directly</Text>
        {state.contactsStatus === "error" && <Button title="Retry loading contact numbers" variant="secondary" onPress={() => void state.loadContacts()} />}
        {state.contacts.map((contact) => <Text key={contact.id} selectable style={{ color: BrandColors.secondary }}>{contact.name} · {contact.phoneNumber}</Text>)}
      </View>}
      {!record && state.phase === "idle" && <Button title="Back to SOS" variant="secondary" onPress={() => router.replace("/sos")} />}
    </ScrollView>
    {record?.status === "active" && <View style={[styles.footer, { paddingBottom: actionFooterPadding(bottom, true) }]}>
      <SlideButton key={state.stopping ? "stopping" : "ready"}
        label={state.stopping ? "Stopping SOS" : "Slide to stop SOS"}
        disabled={state.stopping} onComplete={() => void state.stop()} direction="right" thumbSymbol={"\u00D7"}
        style={styles.slider} trackColor="#B51014" borderColor="#B51014"
        thumbColor="#FFFFFF" labelColor="#FFFFFF" arrowColor="#DF1014" />
    </View>}
  </SafeAreaView>;
}
