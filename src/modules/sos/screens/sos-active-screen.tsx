import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BrandColors, Typography } from "@/shared/theme";
import { useTheme } from "@/shared/hooks";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { ageLabel, hasPending, messagePresentation, type SosRecord, type Submission } from "../types";
import { styles } from "./sos-active-screen.styles";
import { countdownColors } from "./sos-countdown-screen.styles";

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

function ContactCard({ recipient, now }: { recipient: SosRecord["recipients"][number]; now: number }) {
  const colors = useTheme();
  const dark = useColorScheme() === "dark";
  const [expanded, setExpanded] = useState(false);
  const presentation = messagePresentation(recipient.initial, now);
  const tones = {
    Delivered: { text: dark ? "#86EFAC" : "#219447", badge: dark ? "#163824" : "#E9F9ED", bar: "#20D32B", steps: 3 },
    Sent: { text: dark ? "#93B4FF" : "#2460E4", badge: dark ? "#1E2D4E" : "#F3F7FF", bar: "#2460E4", steps: 2 },
    Submitted: { text: dark ? "#CBD5E1" : "#405171", badge: dark ? "#253147" : "#EEF3F7", bar: "#8E8E8E", steps: 1 },
  };
  const failed = presentation.label === "Failed";
  const tone = tones[presentation.label as keyof typeof tones] ?? {
    text: failed ? colors.error : colors.textMuted,
    badge: failed ? colors.errorBackground : colors.backgroundSelected,
    bar: failed ? colors.error : colors.textMuted, steps: 0,
  };
  const initials = recipient.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
  return <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button"
      accessibilityLabel={`${recipient.name}: ${presentation.label}. ${presentation.detail}`}
      accessibilityHint="Show or hide message details" accessibilityState={{ expanded }} style={styles.contactHeader}>
      <View style={[styles.avatar, { backgroundColor: dark ? colors.backgroundSelected : "#EEF4FF" }]}>
        <Text style={[styles.initials, { color: dark ? colors.accent : "#2460E4" }]}>{initials}</Text>
      </View>
      <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={2}>{recipient.name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: tone.badge }]}>
        <Text accessibilityLiveRegion="polite" style={[styles.statusText, { color: tone.text }]}>{presentation.label}</Text>
      </View>
    </Pressable>
    <View style={styles.progressTrack} accessible accessibilityLabel={`SOS message: ${presentation.label}. ${presentation.detail}`}>
      {[1, 2, 3].map((step) => <View key={step} style={[styles.progressSegment, {
        backgroundColor: step <= tone.steps ? tone.bar : dark ? colors.border : "#E3E5E9",
      }]} />)}
    </View>
    {failed && <Text style={[Typography.bodySmall, { color: colors.error }]}>{presentation.detail}</Text>}
    {recipient.initial.status === "unknown" && <Text style={[Typography.bodySmall, { color: colors.text }]}>{presentation.detail}</Text>}
    {recipient.ended && <MessageRow label="SOS ended message" value={recipient.ended} now={now} color={colors.text} />}
    {expanded && <View style={styles.contactDetails}>
      <Text selectable style={[Typography.bodySmall, { color: colors.text }]}>{recipient.phone}</Text>
      <MessageRow label="SOS message" value={recipient.initial} now={now} color={colors.text} />
    </View>}
  </View>;
}

export function SosActiveScreen() {
  const router = useRouter();
  const sliderColors = countdownColors[useColorScheme()];
  const state = useSosStore();
  useSosStatus(state.ready, true);
  const record = state.record;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const title = record?.status === "active" ? "SOS active" : record?.status === "ended" ? "SOS ended by you" :
    state.phase === "submitting" ? "Requesting help" : state.phase === "checking" ? "Checking SOS status" : "SOS not confirmed";
  const cooldown = record?.statusRefresh?.nextAllowedAt ? Date.parse(record.statusRefresh.nextAllowedAt) - now : 0;
  const refreshing = state.refreshing || record?.statusRefresh?.state === "pending" && Date.parse(record.statusRefresh.expiresAt ?? "") > now;
  const close = async () => { await state.dismissEnded(); router.replace("/sos"); };
  return <PageLayout title="SOS" backgroundColor={BrandColors.error} headerTextColor={BrandColors.secondary}
    contentStyle={[styles.content, { gap: 20 }]} footerStyle={styles.footer}
    footer={record?.status === "active" ? <View style={{ gap: 12 }}>
      <SlideButton key={state.stopping ? "stopping" : "ready"} label={state.stopping ? "Stopping SOS" : "Slide to stop SOS"}
          disabled={state.stopping} onComplete={() => void state.stop()} direction="right" thumbSymbol="×"
          style={styles.slider} trackColor={sliderColors.track} borderColor={sliderColors.border}
          thumbColor="#FFFFFF" labelColor="#FFFFFF" arrowColor="#DF1014" />
    </View> : undefined}>
    <Text accessibilityLiveRegion="polite" style={[Typography.largeTitle, styles.title]}>{title}</Text>
    <Text style={[Typography.body, styles.description]}>
      {record?.status === "active" ? "An active SOS does not mean every message was submitted successfully." :
        record?.status === "ended" ? "Already-submitted SMS cannot be recalled. End-update results are shown below." :
          "Do not assume contacts were notified. You can contact them directly while checking status."}
    </Text>
    {state.error && <Text accessibilityLiveRegion="polite" style={[Typography.body, styles.description]}>{state.error}</Text>}
    {state.error && <Button title="Retry status" variant="secondary" isLoading={state.refreshing} onPress={() => void state.refreshStatus()} />}
    {state.notice && <Text style={[Typography.bodySmall, styles.description]}>{state.notice}</Text>}
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Text style={[Typography.bodySmall, styles.description, { flex: 1 }]}>{state.lastFetchedAt ? `Updated ${ageLabel(state.lastFetchedAt, now)}` : "Status not loaded yet"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh message status" disabled={!!refreshing || cooldown > 0 || state.phase === "submitting"}
        onPress={() => void state.refreshStatus()} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="refresh" size={20} color={BrandColors.secondary} />
      </Pressable>
    </View>
    <Text style={[Typography.bodySmall, styles.description]}>{refreshing ? "Checking message status…" : cooldown > 0
      ? `Refresh available in ${Math.ceil(cooldown / 1000)} seconds` : hasPending(record, now) ? "Status updates automatically" : "Latest known message results"}</Text>
    {state.phase === "retry" && <Button title="Retry the same SOS request" variant="secondary" onPress={() => void state.retry()} />}
    {record && <>
      <Text style={[Typography.bodySmall, styles.description]}>{record.location
        ? "Phone location snapshot captured " + new Date(record.location.capturedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) + " (Asia/Manila). This is not live tracking."
        : "Location unavailable or sharing disabled."}</Text>
      {record.recipients.some((r) => r.initial.errorCode === "location_omitted_message_limit") &&
        <Text style={[Typography.bodySmall, styles.description]}>Location was omitted because the SMS length limit was reached.</Text>}
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
    {record?.status === "ended" && <Button title="Back to SOS" variant="secondary" onPress={() => void close()} />}
    {!record && state.phase === "idle" && <Button title="Back to SOS" variant="secondary" onPress={() => router.replace("/sos")} />}
  </PageLayout>;
}
